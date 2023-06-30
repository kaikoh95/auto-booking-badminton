import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import styles from './dropdown.module.css'

interface TimeMap {
  [key: string]: string;
}

export const Dropdown = (props: { options: TimeMap[]; onChange: any; selectedOption: string }) => {
  const { options, onChange, selectedOption } = props;
  const defaultValue = 'Select a Time';

  return (
    <FormControl className={styles.formControl}>
      <InputLabel id="dropdown-label" className={styles.dropdownLabel}>Select a Time (24-hour format)</InputLabel>
      <Select
        labelId="dropdown-label"
        id="dropdown"
        value={selectedOption}
        onChange={onChange}
        autoWidth
      >
        <MenuItem key={-1} value={defaultValue}>Select a Time</MenuItem>
        {options.map((option, index) => (
          <MenuItem key={index} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
