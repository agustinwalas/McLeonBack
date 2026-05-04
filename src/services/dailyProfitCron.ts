// src/services/dailyProfitCron.ts
import cron from 'node-cron';
import { DailyProfitController } from '../controllers/dailyProfit.controller';
import DailyProfit from '../models/DailyProfit';
import Sale from '../models/Sale';

const normalize = (d: Date) => DailyProfitController.normalizeToUTCDay(d);

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
      await DailyProfitController.saveDailyProfit(normalize(new Date()));
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
 * y calcula las ganancias para esos días faltantes o recientes.
 */
async function fillMissingDays() {
  try {
    const firstSale = await Sale.findOne({ status: { $ne: 'CANCELLED' } })
      .sort({ createdAt: 1 })
      .select('createdAt');

    if (!firstSale) {
      console.log('ℹ️ No hay ventas, no se necesita completar días');
      return;
    }

    const startDate = normalize(new Date(firstSale.createdAt));
    const today = normalize(new Date());

    // Umbral para recálculo de días recientes (últimos 30 días)
    const recentThreshold = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Obtener fechas ya registradas usando clave UTC YYYY-MM-DD
    const existingDays = await DailyProfit.find({
      date: { $gte: startDate, $lte: today },
    }).select('date').lean();

    const existingDatesSet = new Set(
      existingDays.map((d) => d.date.toISOString().split('T')[0])
    );

    let processed = 0;
    let currentDate = new Date(startDate);

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isMissing = !existingDatesSet.has(dateStr);
      const isRecent = currentDate >= recentThreshold;

      if (isMissing || isRecent) {
        await DailyProfitController.saveDailyProfit(new Date(currentDate));
        processed++;
      }

      // Avanzar un día en UTC (sin depender del timezone local)
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    if (processed > 0) {
      console.log(`✅ Se completaron/recalcularon ${processed} días de ganancias`);
    } else {
      console.log('ℹ️ Todos los días de ganancias están al día');
    }

    // Siempre recalcular hoy al arrancar
    await DailyProfitController.saveDailyProfit(today);
  } catch (error) {
    console.error('❌ Error al completar días faltantes:', error);
  }
}
