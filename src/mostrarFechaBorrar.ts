import { JDateTime } from "./Calendar/DateTime/JDateTime"

export default function mostrarFecha(dt: JDateTime) {
  const {
    date: {
      dayOfMonth, monthName, dayName, year, halfWeekOfYear
    },
    time: {
      hour, minutes
    }, } = dt.getDateTime()
  console.log(dayName, dayOfMonth, monthName, year, '-', `${hour}:${minutes} - hw: ${halfWeekOfYear}`)
}
