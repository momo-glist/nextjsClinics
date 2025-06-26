import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fr } from "date-fns/locale";
import "@/styles/datepicker.css";

type Props = {
  date: string | null;
  setDate: (date: string | null) => void;
};

export default function DatePickerAgenda({ date, setDate }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    date ? new Date(date) : null
  );

  // useEffect(() => {
  //   if (selectedDate) {
  //     const dateOnly = selectedDate.toISOString().split("T")[0];

  //     fetch(`/api/agenda?date=${dateOnly}`)
  //       .then((res) => res.json())
  //       .then((data) => {
  //         if (Array.isArray(data?.times)) {
  //           const excluded = data.times.map((t: string) => new Date(t));
  //           setExcludedTimes(excluded);
  //         } else {
  //           setExcludedTimes([]);
  //         }
  //       })
  //       .catch((err) => {
  //         console.error("Erreur lors de la récupération des heures :", err);
  //         setExcludedTimes([]);
  //       });
  //   } else {
  //     setExcludedTimes([]);
  //   }
  // }, [selectedDate]);

  return (
    <div className="my-4">
      <label className="block font-semibold mb-2">Date et heure</label>
      <DatePicker
        locale={fr}
        selected={selectedDate}
        onChange={(date: Date | null) => {
          setSelectedDate(date);
          setDate(date ? date.toISOString() : null);
        }}
        showTimeSelect
        timeIntervals={30}
        dateFormat="Pp"
        placeholderText="Choisissez une date et heure"
        className="input input-bordered w-full"
        minDate={new Date()}
      />
    </div>
  );
}