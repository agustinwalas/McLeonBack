// src/services/dailyProfitCron.ts
import cron from 'node-cron';
import { DailyProfitController } from '../controllers/dailyProfit.controller';
import DailyProfit from '../models/DailyProfit';
import Sale from '../models/Sale';

/**
 * Inicializa el cron job que calcula las ganancias diarias.
 * - Corre todos los días a las 23:59
 * - Al iniciar el servidor, verifica si faltan días por calcular y los completa
 */
export function initDailyProfitCron() {
  console.log('⏰ Inicializando cron de ganancias diarias...');

  // Cron: todos los días a las 23:59
  cron.schedule('59 23 * * *', async () => {
    try {
      console.log('⏰ [CRON] Calculando ganancias del día...');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await DailyProfitController.saveDailyProfit(today);
      console.log('✅ [CRON] Ganancias del día calculadas correctamente');
    } catch (error) {
      console.error('❌ [CRON] Error al calcular ganancias diarias:', error);
    }
  }, {
    timezone: 'America/Argentina/Buenos_Aires',
  });

  // Al iniciar: verificar y completar días faltantes
  fillMissingDays().catch((error) => {
    console.error('❌ Error al completar días faltantes:', error);
  });

  console.log('✅ Cron de ganancias diarias configurado (23:59 AR)');
}

/**
 * Verifica si hay días sin registro desde la primera venta hasta hoy
 * y calcula las ganancias para esos días faltantes
 */
async function fillMissingDays() {
  try {
    // Obtener la primera venta
    const firstSale = await Sale.findOne({ status: { $ne: 'CANCELLED' } })
      .sort({ createdAt: 1 })
      .select('createdAt');

    if (!firstSale) {
      console.log('ℹ️ No hay ventas, no se necesita completar días');
      return;
    }

    const startDate = new Date(firstSale.createdAt);
    startDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtener todos los días que ya tienen registro
    const existingDays = await DailyProfit.find({
      date: { $gte: startDate, $lte: today },
    }).select('date').lean();

    const existingDatesSet = new Set(
      existingDays.map((d) => d.date.toISOString().split('T')[0])
    );

    // Obtener días con $0 que podrían tener ventas reales
    const zeroDays = await DailyProfit.find({
      date: { $gte: startDate, $lte: today },
      salesCount: 0,
    }).select('date').lean();

    const zeroDatesSet = new Set(
      zeroDays.map((d) => d.date.toISOString().split('T')[0])
    );

    // Calcular para los días faltantes o que tienen $0 pero podrían tener ventas
    let missingDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isMissing = !existingDatesSet.has(dateStr);
      const isZeroDay = zeroDatesSet.has(dateStr);

      if (isMissing || isZeroDay) {
        await DailyProfitController.saveDailyProfit(new Date(currentDate));
        missingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (missingDays > 0) {
      console.log(`✅ Se completaron/recalcularon ${missingDays} días de ganancias`);
    } else {
      console.log('ℹ️ Todos los días de ganancias están al día');
    }

    // También recalcular hoy por si hubo ventas nuevas
    await DailyProfitController.saveDailyProfit(today);
  } catch (error) {
    console.error('❌ Error al completar días faltantes:', error);
  }
}
