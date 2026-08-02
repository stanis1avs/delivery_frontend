/**
 * Общее состояние выбранного заказа.
 *
 * Sidebar пишет сюда при выборе карточки, а блоки справа (получатель, транспорт,
 * параметры доставки) читают. Через props не получится: в index.vue эти блоки —
 * соседи Sidebar, а не его потомки. Раньше из-за этого они были захардкожены.
 */
export const useActiveOrder = () => useState('active-order', () => null);

/** Форматирование, общее для карточек заказа. */
export const orderFormat = {
  /** Короткий номер заказа из UUID: 77777777-7777-… → 77777777 */
  shortId(id) {
    if (!id) return '—';
    return String(id).split('-')[0].toUpperCase();
  },

  /** метры → «2.9 км» либо «850 м» */
  distance(meters) {
    if (meters == null) return '—';
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} км` : `${Math.round(meters)} м`;
  },

  /** секунды → «4 мин» либо «1 ч 20 мин» */
  duration(seconds) {
    if (seconds == null) return '—';
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} мин`;
    return `${Math.floor(mins / 60)} ч ${mins % 60} мин`;
  },

  /**
   * Ожидаемое прибытие: момент последней смены статуса + расчётное время в пути.
   */
  arrival(statusChangedAt, durationSeconds) {
    if (!statusChangedAt || durationSeconds == null) return '—';
    const at = new Date(new Date(statusChangedAt).getTime() + durationSeconds * 1000);
    if (Number.isNaN(at.getTime())) return '—';
    return at.toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    });
  },
};
