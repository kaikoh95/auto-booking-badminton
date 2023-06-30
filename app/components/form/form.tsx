'use client'

import { kv } from "@vercel/kv";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { Checkbox, FormControlLabel, TextField } from '@mui/material';
import { SetStateAction, useEffect, useRef, useState } from 'react';
import { Dropdown } from '../dropdown/dropdown';
import styles from './form.module.css'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/en'; // Import the desired locale (e.g., 'en' for English)
import LoadingOverlay from '../loading-overlay/loading-overlay';

dayjs.locale('en'); // Set the locale for dayjs

export default function Form() {
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedOptionB, setSelectedOptionB] = useState('');
  const [selectedOptionC, setSelectedOptionC] = useState('');
  const [selectedOptionD, setSelectedOptionD] = useState('');
  const [inputUsernameValue, setInputUsernameValue] = useState('');
  const [inputPasswordValue, setInputPasswordValue] = useState('');
  const [inputCourtsValue, setInputCourtsValue] = useState(1);
  const [inputCourtNumValue, setInputCourtNumValue] = useState(1);
  const [inputHoursValue, setInputHoursValue] = useState(2);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDryrun, setIsDryrun] = useState(true);
  const [inputRetriesValue, setInputRetriesValue] = useState(3);
  const store: any = useRef({});

  useEffect(() => {
    if (typeof window !== 'undefined' && !Object.keys(store.current).length) {
      store.current = JSON.parse(localStorage.getItem('auto-booking-badminton') ?? '{}');
      const { password = '', optionSelected = '', optionSelectedB = '', optionSelectedC = '', optionSelectedD = '', hoursValue = 2, username = '', courts = 1, courtNum = 1, isCheckedValue = false, isDryrunValue = true, inputRetriesVal = 3 } = store.current;
      setSelectedOption(optionSelected);
      setSelectedOptionB(optionSelectedB);
      setSelectedOptionC(optionSelectedC);
      setSelectedOptionD(optionSelectedD);
      setInputPasswordValue(password);
      setInputUsernameValue(username);
      setInputCourtsValue(courts);
      setInputCourtNumValue(courtNum);
      setIsChecked(isCheckedValue);
      setInputHoursValue(hoursValue);
      setIsDryrun(isDryrunValue);
      setInputRetriesValue(inputRetriesVal);
    }
  }, []);

  let clock = '0900';
  const clockMaps: any = [...Array(30).keys()].map((num) => {
    const map = {
      label: clock,
      value: num + 18,
    };
    if (clock[2] === '0') {
      clock = `${clock.slice(0, 2)}3${clock[3]}`;
    } else if (clock[2] === '3') {
      const hour = Number(`${clock.slice(0,2)}`) + 1;
      let hourString = `${hour}`;
      if (hour < 10) hourString = `0${hour}`;
      clock = `${hourString}0${clock[3]}`;
    }
    return map;
  });

  const handleCheckboxChange = (event: { target: { checked: boolean | ((prevState: boolean) => boolean); }; }) => {
    setIsChecked(event.target.checked);
    store.current.isCheckedValue = event.target.checked;
    localStorage.setItem('auto-booking-badminton', JSON.stringify(store.current));
  };

  const handleDryrunChange = (event: { target: { checked: boolean | ((prevState: boolean) => boolean); }; }) => {
    setIsDryrun(event.target.checked);
    store.current.isDryrunValue = event.target.checked;
    localStorage.setItem('auto-booking-badminton', JSON.stringify(store.current));
  };

  const handleDateChange = (date: any) => {
    setSelectedDate(date);
  };

  const handleDropdownChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setSelectedOption(event.target.value);
    store.current.optionSelected = event.target.value;
    localStorage.setItem('auto-booking-badminton', JSON.stringify(store.current));
  };

  const handleDropdownChangeB = (event: { target: { value: SetStateAction<string>; }; }) => {
    setSelectedOptionB(event.target.value);
    store.current.optionSelectedB = event.target.value;
    localStorage.setItem('auto-booking-badminton', JSON.stringify(store.current));
  };

  const handleDropdownChangeC = (event: { target: { value: SetStateAction<string>; }; }) => {
    setSelectedOptionC(event.target.value);
    store.current.optionSelectedC = event.target.value;
    localStorage.setItem('auto-booking-badminton', JSON.stringify(store.current));
  };

  const handleDropdownChangeD = (event: { target: { value: SetStateAction<string>; }; }) => {
    setSelectedOptionD(event.target.value);
    store.current.optionSelectedD = event.target.value;
    localStorage.setItem('auto-booking-badminton', JSON.stringify(store.current));
  };

  const handleInputRetriesChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputRetriesValue(Number(event.target.value));
    store.current.inputRetriesVal = event.target.value;
    localStorage.setItem('auto-booking-badminton', JSON.stringify(store.current));
  };

  const handleInputUsernameChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputUsernameValue(event.target.value);
    store.current.username = event.target.value;
    localStorage.setItem('auto-booking-badminton', JSON.stringify(store.current));
  };
  
  const handleInputPasswordChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputPasswordValue(event.target.value);
    store.current.password = event.target.value;
    localStorage.setItem('auto-booking-badminton', JSON.stringify(store.current));
  };
  
  const handleInputCourtsChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputCourtsValue(Number(event.target.value));
    store.current.courts = event.target.value;
    localStorage.setItem('auto-booking-badminton', JSON.stringify(store.current));
  };
  
  const handleInputHoursChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputHoursValue(Number(event.target.value));
    store.current.hoursValue = event.target.value;
    localStorage.setItem('auto-booking-badminton', JSON.stringify(store.current));
  };
  
  const handleInputCourtNumChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputCourtNumValue(Number(event.target.value));
    store.current.courtNum = event.target.value;
    localStorage.setItem('auto-booking-badminton', JSON.stringify(store.current));
  };

  const handlePostRequest = async (data: any) => {
    try {
      const url = '/api/waitakere-court-bookings';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      console.log(responseData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: { preventDefault: () => void; }) => {
    event.preventDefault();
    
    if (!inputUsernameValue ||
      !inputPasswordValue ||
      !inputCourtsValue ||
      !inputCourtNumValue ||
      !selectedOption ||
      !selectedOptionB ||
      !selectedOptionC ||
      !selectedOptionD ||
      !selectedDate ||
      !inputHoursValue
    ) {
      return;
    }

    setIsLoading(true);
    const username = inputUsernameValue;
    const password = inputPasswordValue;
    const courts = inputCourtsValue;
    const courtNum = inputCourtNumValue;
    const dateString = new Date(selectedDate!['$d'] as string);
    let fullMonth = `${dateString.getMonth() + 1}`;
    if (fullMonth.length === 1) {
      fullMonth = `0${fullMonth}`;
    }
    let fullDate = `${dateString.getDate()}`;
    if (fullDate.length === 1) {
      fullDate = `0${fullDate}`;
    }
    const date = `${dateString.getFullYear()} ${fullMonth} ${fullDate}`;
    const adjacentCourts = isChecked;
    const dryrun = isDryrun;
    const attempts = inputRetriesValue;
    const hours = inputHoursValue;
    
    const selectedTime = selectedOption;
    const selectedTimeB = selectedOptionB;
    const selectedTimeC = selectedOptionC;
    const selectedTimeD = selectedOptionD;
    
    const firstChoice: number[] = [];
    const secondChoice: number[] = [];
    const thirdChoice: number[] = [];
    const fourthChoice: number[] = [];

    [...Array(hours * 2).keys()].forEach((hour, index) => {
      firstChoice.push(Number(selectedTime) + index);
      secondChoice.push(Number(selectedTimeB) + index);
      thirdChoice.push(Number(selectedTimeC) + index);
      fourthChoice.push(Number(selectedTimeD) + index);
    });
 
    const preferred = {
      [`${JSON.stringify(firstChoice)}`]: 1, 
      [`${JSON.stringify(secondChoice)}`]: 2, 
      [`${JSON.stringify(thirdChoice)}`]: 3, 
      [`${JSON.stringify(fourthChoice)}`]: 4, 
    };

    const data = {
      username,
      password,
      courts,
      courtNum,
      date,
      preferred,
      adjacentCourts,
      dryrun,
      attempts,
    }
    handlePostRequest({data});
  };

  return (
    <>
      {isLoading && <LoadingOverlay loading={isLoading}/>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <h3>Required Fields*</h3>
        <div>
          <TextField
            id="inputName"
            label="Username"
            value={inputUsernameValue}
            onChange={handleInputUsernameChange}
          />
        </div>
        <div>
          <TextField
            id="inputPassword"
            label="Password"
            value={inputPasswordValue}
            onChange={handleInputPasswordChange}
            type="password"
          />
        </div>
        <div>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Select a Date"
              value={selectedDate}
              onChange={(date) => handleDateChange(date)}
            />
          </LocalizationProvider>
        </div>
        <div>
          <TextField
            id="inputHours"
            label="Hours to book"
            value={inputHoursValue}
            onChange={handleInputHoursChange}
            type="number"
            InputProps={{
              inputProps: {
                min: 1,
              },
            }}
          />
        </div>
        <div>
          <TextField
            id="inputCourts"
            label="Courts to book"
            value={inputCourtsValue}
            onChange={handleInputCourtsChange}
            type="number"
            InputProps={{
              inputProps: {
                min: 1,
              },
            }}
          />
        </div>
        {inputCourtsValue > 1 && <div>
          <FormControlLabel
            control={<Checkbox checked={isChecked} onChange={handleCheckboxChange} />}
            label={<span className={styles.label}>Adjacent courts preferred?</span>}
          />
        </div>}
        <div>
          <TextField
            id="inputCourtNum"
            label="Preferred Court Number"
            value={inputCourtNumValue}
            onChange={handleInputCourtNumChange}
            type="number"
            InputProps={{
              inputProps: {
                min: 1,
                max: 12,
              },
            }}
          />
        </div>
        <div>
          <Dropdown options={clockMaps} onChange={handleDropdownChange} selectedOption={selectedOption} />
        </div>
        <div>
          <h5>Other preferences (in case first choice is taken)</h5>
        </div>
        <div>
          <Dropdown options={clockMaps} onChange={handleDropdownChangeB} selectedOption={selectedOptionB} />
        </div>
        <div>
          <Dropdown options={clockMaps} onChange={handleDropdownChangeC} selectedOption={selectedOptionC} />
        </div>
        <div>
          <Dropdown options={clockMaps} onChange={handleDropdownChangeD} selectedOption={selectedOptionD} />
        </div>
        <h3>Additional Configurations</h3>
        <div>
          <FormControlLabel
            control={<Checkbox checked={isDryrun} onChange={handleDryrunChange} />}
            label={<span className={styles.label}>Dry run? (if checked, does not actually make the booking)</span>}
          />
        </div>
        <div>
          <TextField
            id="inputRetries"
            label="Max attempts to run the script"
            value={inputRetriesValue}
            onChange={handleInputRetriesChange}
            type="number"
            InputProps={{
              inputProps: {
                min: 1,
                max: 5,
              },
            }}
          />
        </div>
        <button className={styles.button} type="submit">Submit</button>
      </form>
    </>
  );
}
