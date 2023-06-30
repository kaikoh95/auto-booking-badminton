import puppeteer from 'puppeteer';
import mailgun from 'mailgun-js';
import fs from 'fs';
import { kv } from '@vercel/kv';

const mg = mailgun({ apiKey: process.env.API_KEY!, domain: process.env.DOMAIN! });
const fromSender = 'Auto-booking Badminton <auto-booking-badminton@gmail.com>';
const toReceipient = 'kaikoh95@gmail.com';
const waitForTimeout = (ms: number) => new Promise(r => setTimeout(r, ms));
let clockB = '0000';
const clockMaps = [...Array(48).keys()].map((num) => {
  const map = {
    label: clockB,
    value: num,
  };
  if (clockB[2] === '0') {
    clockB = `${clockB.slice(0, 2)}3${clockB[3]}`;
  } else if (clockB[2] === '3') {
    const hour = Number(`${clockB.slice(0,2)}`) + 1;
    let hourString = `${hour}`;
    if (hour < 10) hourString = `0${hour}`;
    clockB = `${hourString}0${clockB[3]}`;
  }
  return map;
});

export default async function handler(req: any, res: any) {
  const data: any = await kv.hget(`user_${process.env.WAITAKERE_USERNAME}`, 'data');
  if (!data?.username) return;
  const { username, password, courts, courtNum, date, preferred, adjacentCourts, dryrun, attempts: totalAttempts } = data;

  let MAX_COURTS = courts;
  const USER = username;
  const PASS = password;
  const PREF_COURT = courtNum; // eg will consider X & X-1 or X & X+1 when booking 2 courts, eg if set to 8, will consider 7,8 and 8,9 as VALID PAIRINGS
  const PREFERRED_DATE = date; // please format to YYYY MM DD (need space between)
  const USE_ADJACENT_PAIRING = adjacentCourts; // if you want adjacent courts, this will only successfully book if the 2 adjacent courts are FREE
  const DRY_RUN = dryrun; // set to false if you actually want to book it
  const MAX_RETRIES = totalAttempts;

  const PREFERRED = preferred;

  let attempts = 1;
  const bookings: { court: string; times: any; }[] = [];
  const bookCourts = async () => {
    try {
      console.log(`Starting Script: Attempt ${attempts}/${MAX_RETRIES}`);
      const courtRows: {[key:string]: any[] } = {};
      const availableSlots: any = {};
      const preferredAvailableSlots: {[key:string]: any[] }  = {};
      let courtsToBook = 0;

      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();

      await page.goto('https://internetbookings.net.nz/smii/');

      await page.type('#user_div input', USER);
      await page.type('#pass_div input', PASS);
      await page.click('#login_btn');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('Login successful!');
      await page.screenshot({ path: 'loggedin.png' });

      const options = await page.$$eval('#date_nav select[name="date"] option', (elements, prefDate) =>
        elements.map((el) => el.value === prefDate ? el.value : null),
        PREFERRED_DATE,
      )
      const dateSelected = options.filter((opt) => !!opt)[0];
      if (!dateSelected) throw new Error('Please provide valid date');

      await page.select('#date_nav select[name="date"]', dateSelected);
      await waitForTimeout(5000);
      console.log('Selected date: ', dateSelected);
      await page.screenshot({ path: 'selecteddate.png' });

      const timeRows = await page.$$('#grid_box .objbox tr td:nth-child(1)');
      for (let i = 0; i < timeRows.length; i++) {
        const row = timeRows[i];
        const courtCellsHandle = await row.evaluateHandle((element) => element!.parentNode!.childNodes);
        const courtCells = await courtCellsHandle.evaluate((nodes) => Array.from(nodes).map((node, index) => {
          if (index === 0) return (node as any).innerText;
          const style = window.getComputedStyle(node as any);
          const booked = ['rgb(255, 181, 181)', 'rgb(152, 251, 152)'];
          return booked.includes(style.backgroundColor) ? 'booked' : 'free';
        }));

        const [courtStartTime, ...courtAvailabilities] = courtCells;
        courtAvailabilities.forEach((availability, index) => {
          courtRows[`Court${index+1}`] = [
            ...courtRows[`Court${index+1}`] ?? [],
            `${courtStartTime}---${availability}`,
          ] as any
        });
      }
      console.log(courtRows);
      for (const [court, slots] of Object.entries(courtRows)) {
        const preferredKey = JSON.parse(Object.keys(PREFERRED)[0]);
        if (preferredKey.length === 4) {
          for (let i = 0; i < (slots as any[]).length - 3; i++) {
            const available = slots[i].includes('free') && slots[i+1].includes('free') && slots[i+2].includes('free') && slots[i+3].includes('free');
            if (!available) continue;
            const combination = [i, i+1, i+2, i+3];
            if (PREFERRED[JSON.stringify(combination)]) {
              preferredAvailableSlots[court] = [
                ...preferredAvailableSlots[court] ?? [],
                combination,
              ];
              preferredAvailableSlots[court].sort((a: any, b: any) => PREFERRED[JSON.stringify(a)] - PREFERRED[JSON.stringify(b)]);
            }
            availableSlots[court] = [
              ...availableSlots[court] ?? [],
              combination,
            ];
          }
        } else if (preferredKey.length === 2) {
          for (let i = 0; i < (slots as any[]).length - 1; i++) {
            const available = slots[i].includes('free') && slots[i+1].includes('free');
            if (!available) continue;
            const combination = [i, i+1];
            if (PREFERRED[JSON.stringify(combination)]) {
              preferredAvailableSlots[court] = [
                ...preferredAvailableSlots[court] ?? [],
                combination,
              ];
              preferredAvailableSlots[court].sort((a: any, b: any) => PREFERRED[JSON.stringify(a)] - PREFERRED[JSON.stringify(b)]);
            }
            availableSlots[court] = [
              ...availableSlots[court] ?? [],
              combination,
            ];
          }
        }
      }
      console.log(preferredAvailableSlots);

      const courtsAvailableWithPreferredSlots = Object.keys(preferredAvailableSlots).length;
      if (courtsAvailableWithPreferredSlots < 1) {
        throw new Error("Nice try but you were too slow. Try harder next time :P");
      } else if (courtsAvailableWithPreferredSlots === 1) {
        MAX_COURTS = 1;
      }

      const rows = await page.$$('#grid_box .objbox tr');
      const courtsPairing: {[key:string]: any[] }  = {};
      const adjacentCourtsPairing: {[key:string]: any[] }  = {};
      let currentPairNumber: {[key:string]: any }  = {
        ['1']: 0,
        ['2']: 0,
        ['3']: 0,
        ['4']: 0,
      };
      while (courtsToBook <= MAX_COURTS) {
        const prefSlotsLen = Object.keys(preferredAvailableSlots).length;
        for (let i = 0; i < prefSlotsLen; i++) {
          const key = Object.keys(preferredAvailableSlots)[i];
          const value = preferredAvailableSlots[key];

          for (let j = 0; j < value.length; j++) {
            const pref = value[j];
            const prio = PREFERRED[JSON.stringify(pref)];

            const currentPairPrio = courtsPairing[`${prio}`];
            if (!currentPairPrio) {
              courtsPairing[`${prio}`] = [[]];
            }
            if (courtsPairing[`${prio}`][currentPairNumber[`${prio}`]].length < 2) {
              courtsPairing[`${prio}`][currentPairNumber[`${prio}`]] = [
                ...courtsPairing[`${prio}`][currentPairNumber[`${prio}`]] ?? [],
                {
                  [key]: pref,
                },
              ];
              if (courtsPairing[`${prio}`][currentPairNumber[`${prio}`]].length === 2) {
                const [first, second] = courtsPairing[`${prio}`][currentPairNumber[`${prio}`]];
                const firstCourtKey = Object.keys(first)[0];
                const firstCourtNum = Number(firstCourtKey.replace('Court', ''));
                const secondCourtKey = Object.keys(second)[0];
                const secondCourtNum = Number(secondCourtKey.replace('Court', ''));
                if (Math.abs(firstCourtNum - secondCourtNum) === 1) {
                  const adjPairPrio = adjacentCourtsPairing[`${prio}`];
                  if (!adjPairPrio) {
                    adjacentCourtsPairing[`${prio}`] = [[]];
                  }
                  adjacentCourtsPairing[`${prio}`][currentPairNumber[`${prio}`]] = [first, second];
                }
                
                currentPairNumber[`${prio}`] += 1;
                courtsPairing[`${prio}`][currentPairNumber[`${prio}`]] = [
                  {
                    [key]: pref,
                  },
                ];
              }
            }
          }
        }
        console.log(JSON.stringify(adjacentCourtsPairing));
        if (USE_ADJACENT_PAIRING) {
          for (const [, combi] of Object.entries(adjacentCourtsPairing)) {
            if (!combi?.length) continue;
            for (let k = 0; k < combi.length; k++) {
              if (!combi[k]) continue;
              if (!JSON.stringify(combi[k]).includes(`Court${PREF_COURT}`)) continue;

              for (let i = 0; i < combi[k].length; i++) {
                if (!combi[k][i]) continue;
                const key = Object.keys(combi[k][i])[0];
                
                const courtNumber = Number(key.replace('Court', ''));
                
                const value = combi[k][i][key];
                console.log('Choosing: ', key, value)
                bookings.push({ court: key, times: value });

                for (let j = 0; j < value.length; j++) {
                  const timeRow = rows[value[j] + 1];
                  const courtTimeRows = await timeRow.evaluateHandle((parentNode) => parentNode.childNodes);
                  const courtTime: any = await courtTimeRows.evaluateHandle((node, index) => node[index], courtNumber);
                  await courtTime.click();
        
                  await waitForTimeout(1000);
                  await page.screenshot({ path: 'selectedtime.png' });
                }
                courtsToBook++;
                if (courtsToBook >= MAX_COURTS) {
                  break;
                }
              }
              if (courtsToBook >= MAX_COURTS) {
                break;
              }
            }
            if (courtsToBook >= MAX_COURTS) {
              break;
            }
          }
        } else {
          for (const [key, value] of Object.entries(preferredAvailableSlots)) {
            const courtNumber = Number(key.replace('Court', ''));
            const pref = value[0];
            for (let j = 0; j < pref.length; j++) {
              const timeRow = rows[pref[j]];
              const courtTimeRows = await timeRow.evaluateHandle((parentNode) => parentNode.childNodes);
              const courtTime: any = await courtTimeRows.evaluateHandle((node, index) => node[index], courtNumber);
              await courtTime.click();
    
              await waitForTimeout(1000);
              await page.screenshot({ path: 'selectedtime.png' });
            }
            courtsToBook++;
            if (courtsToBook >= MAX_COURTS) {
              break;
            }
          }
        }

        if (courtsToBook >= MAX_COURTS) {
          const bookButton: any = await page.$('#book_btn');
          await bookButton.click();

          await waitForTimeout(3000);

          const confirmButton: any = await page.$('#modal_next');
          await confirmButton.scrollIntoView();
          await page.screenshot({ path: 'bookclicked.png' });

          if (!DRY_RUN) {
            await confirmButton.click();
            await waitForTimeout(3000);
            await page.screenshot({ path: 'confirmclicked.png' });
          }

          // @TODO add successful check then break, else retry
          break;
        };
      }

      await browser.close();
      return true;
    } catch (error) {
      if (attempts >= MAX_RETRIES) {
        console.log(`Max retries reached: ${attempts}/${MAX_RETRIES}`);
        throw error;
      }

      attempts += 1;
      await bookCourts();
    }
  };

  try {
    await bookCourts();

    const dateString = new Date(date).toDateString();
    let msg = `Booking confirmed for ${dateString}:\n`;
    bookings.forEach(({times, court}) => {
      const timeStart = clockMaps.filter((clock) => clock.value === times[0])[0].label;
      const timeEnd = clockMaps.filter((clock) => clock.value === (times[times.length - 1] + 1))[0].label;
      msg = `${msg}\n${court}: ${timeStart} - ${timeEnd}`;
    });
    const attachmentPaths = [
      './loggedin.png',
      './selecteddate.png',
      './selectedtime.png',
      './bookedclicked.png',
      ...(DRY_RUN ? [] : ['confirmclicked.png']),
    ];
    const data = {
      from: fromSender,
      to: toReceipient,
      subject: `Hooray! You are going Waitakere Badminton on ${dateString}!!`,
      text: `Good job, you managed you book it this time!\n\n${msg}`,
      attachment: [] as any[],
    };
    try {
      const attachments = attachmentPaths.map((path) => ({
        data: fs.readFileSync(path),
        filename: path.substring(path.lastIndexOf('/') + 1), // Use the file name as the attachment filename
      }));
      data.attachment = attachments as any[];
    } catch (err) {}
  
    mg.messages().send(data, (error) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent successfully');
      }
    });   

    res.status(200).json({ message: 'Booked' });
  } catch (error) {
    console.log(error);
    const dateString = new Date(date).toDateString();
    const data = {
      from: fromSender,
      to: toReceipient,
      subject: `Hard luck...you're not going to Waitakere Badminton on ${dateString}!!`,
      text: `You didn't manage to book the following this time!\n\nDon't give up, just hit harder!!`,
    };
    mg.messages().send(data, (error) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent successfully');
      }
    });
    res.status(400).json({ message: 'Failed' })  
  }
}
