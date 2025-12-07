// composables/useTimeFormatter.ts
export const useTimeFormatter = () => {
  /**
   * Форматирует секунды в строку "Xч Yм" или "Yм".
   * @param seconds Количество секунд
   * @returns отформатированная строка
   */
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0м'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)

    if (h > 0) {
      return `${h}ч ${m}м`
    }
    return `${m}м`
  }

  return { formatTime }
}
