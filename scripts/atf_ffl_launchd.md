# Monthly ATF FFL import on the Mac mini

atf.gov blocks cloud servers, so this runs from a home IP.

1. `pip3 install requests openpyxl`
2. Test: `DR_ADMIN_KEY=<ADMIN_KEY from Vercel> python3 scripts/atf_ffl_fetch.py --dry` (prints per-state counts)
3. Schedule (cron, 20th at 9am local): `crontab -e` and add
   `0 9 20 * * DR_ADMIN_KEY=<key> /usr/bin/python3 /path/to/downrange/scripts/atf_ffl_fetch.py >> ~/ffl-sync.log 2>&1`

Mission Control shows "ATF FFL Import" once it has run. The /api/ffl endpoint uses the imported data automatically and falls back to Google Places for states with no import.
