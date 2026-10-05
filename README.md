# UP CURSOR Monthly Bulletin (website)

A small website that draws the monthly bulletin from a text file.
You edit one file (`data.json`) and add one picture. The site updates itself.

- No Canva, no manual layout.
- Free to run (GitHub Pages + GitHub Actions on a public repository).
- Works on phones and computers.

**Contents**
1. [One-time setup](#1-one-time-setup-about-15-minutes)
2. [Every month](#2-every-month)
3. [How to write data.json](#3-how-to-write-datajson)
4. [How the site behaves](#4-how-the-site-behaves)
5. [Preview on your computer (optional)](#5-preview-on-your-computer-optional)
6. [Changing the look](#6-changing-the-look)
7. [Troubleshooting](#7-troubleshooting)
8. [Good to know](#8-good-to-know)
9. [What is in this folder](#9-what-is-in-this-folder)
10. [Placeholders and assumptions](#10-placeholders-and-assumptions)

---

## 1. One-time setup (about 15 minutes)

You only do this once.

### Step 1: Create a GitHub account
- Go to https://github.com and sign up (free).
- Tip: if you want the project to outlive any one officer, create a free **GitHub Organization** for your org and make the repository there. Then ownership can be handed over each year.

### Step 2: Create the repository
- Click the **+** at the top right, then **New repository**.
- Name it, for example, `bulletin`.
- Choose **Public**. (GitHub Pages on the free plan needs a public repository.)
- Do **not** tick "Add a README" (this project already has one).
- Click **Create repository**.

### Step 3: Upload the project files
1. Unzip the ZIP file on your computer.
2. On the new repository page, click **uploading an existing file**.
3. Open the unzipped folder and drag its **contents** (not the folder itself) into the browser window.
4. Scroll down and click **Commit changes**.

**Important: check for the hidden `.github` folder.**
- After uploading, look at the file list. You must see a folder named `.github`, and inside it `workflows/deploy.yml`.
- Folders that start with a dot are hidden on Mac and sometimes skipped by drag and drop. On Mac, press `Cmd + Shift + .` in Finder to show them.
- If it is missing, add it by hand:
  1. Click **Add file**, then **Create new file**.
  2. In the name box, type `.github/workflows/deploy.yml` (typing `/` makes folders).
  3. Open `.github/workflows/deploy.yml` from the unzipped folder, copy everything, and paste it in.
  4. Click **Commit changes**.
- Alternative: install **GitHub Desktop** (https://desktop.github.com), which uploads hidden folders without trouble.

### Step 4: Turn on GitHub Pages (this cannot be skipped)
- In your repository, click **Settings**.
- In the left menu, click **Pages**.
- Under **Build and deployment**, set **Source** to **GitHub Actions**.
- You need admin access to the repository to see this setting.

### Step 5: Publish the site
- Click the **Actions** tab.
- Click **Check and publish bulletin** in the left list.
- Click **Run workflow**, then the green **Run workflow** button.
- Wait about a minute. A **green check** means the site is live.
- If the run failed with a Pages error, the cause is usually that Step 4 was done after the first upload. Just run it again.
- Your site address is:
  `https://YOUR-USERNAME-OR-ORG.github.io/YOUR-REPOSITORY-NAME/`
  (You can also click the finished run, then the **deploy** box, to see the link.)

### Step 6: Add your logo and image
- **Logo:** upload your logo over `assets/logo.svg`.
  - Open the `assets` folder, click **Add file**, then **Upload files**.
  - Use the same file name.
  - If your logo is a PNG, upload it as `logo.png`, then edit `index.html` and change `assets/logo.svg` to `assets/logo.png`.
  - Use a square image. It is shown in a circle.
- **Picture:** replace `bulletins/2026-09/image.jpg` with your real picture (see Section 2, Step 3).

### Step 7: Give other officers access
- Personal repository: **Settings**, then **Collaborators**, then **Add people**.
- Organization repository: add them through the organization's **Teams** or the repository's **Collaborators**.
- Give them **Write** access. That is enough to edit data and upload pictures.

---

## 2. Every month

Example: making the October 2026 bulletin. Everything is done in the browser.

### Step 1: Create the month's data file
- Go to the main page of your repository.
- Click **Add file**, then **Create new file**.
- In the name box, type `bulletins/2026-10/data.json`.
  - The folder name must be **year, dash, two-digit month**: `2026-10`.
- Paste in the template (copy it from `template/data.json`).
- Fill it in. See [Section 3](#3-how-to-write-datajson).
- Click **Commit changes**, keep "Commit directly to the main branch", and confirm.

### Step 2: Check the file
- Open the **Actions** tab and watch the newest run.
- **Green check:** your data is valid and is being published.
- **Red X:** click the run. A message tells you what to fix and where (for example, "a comma is missing near line 12"). Fix the file and save again.
- If a run fails, nothing breaks. The website simply keeps showing the last good version.

### Step 3: Add the picture
- Open the new `bulletins/2026-10` folder.
- Click **Add file**, then **Upload files**.
- Drag in your picture. **It must be named exactly `image.jpg`** (all lowercase, JPEG format). Rename it on your computer before uploading.
- Keep it under about 2 MB. A wide picture, around 1600 x 600 pixels, works best.
- Click **Commit changes**.

### Step 4: Look at the result
- Wait a minute or two, then open your site and refresh.
- The site shows the newest month that is not in the future (see Section 4).

### Editing something that is already there
- Open the file, click the **pencil icon**, make the change, and click **Commit changes**.
- To replace a picture, upload a new `image.jpg` to the same folder. GitHub asks to replace the old one.

---

## 3. How to write data.json

The file has five sections. All of them are optional. Leave a section out, or write `[]`, and its box disappears from the page.

```json
{
  "orgDates": [
    { "date": "2026-10-18", "label": "AKWE" },
    { "date": "2026-10-24", "endDate": "2026-10-25", "label": "Org Retreat", "note": "Venue to be announced" }
  ],
  "upDates": [
    { "date": "2026-10-12", "label": "Last day of adding subjects" }
  ],
  "birthdays": [
    { "date": "2026-10-03", "name": "Sam" }
  ],
  "links": [
    { "url": "bit.ly/CURSORCARES" },
    { "url": "https://example.com/form", "label": "Sig Req Form" }
  ],
  "reminders": [
    "Support the App Process!",
    "RSVP for AKWE!"
  ]
}
```

| Section | Fields | Notes |
|---|---|---|
| `orgDates` | `date`, `label` | Optional: `endDate` (makes a range like "24-25"), `note` (small text under the label, good for time and place). |
| `upDates` | `date`, `label` | Same fields as `orgDates`. Use it for university-wide dates. |
| `birthdays` | `date`, `name` | The site adds "'s Birthday" for you. Write only the name. |
| `links` | `url` | Optional: `label`. With no label, the web address itself is shown. `https://` is added for you if missing. |
| `reminders` | just text | A plain list of sentences in quotes. |

**Rules that prevent most errors**
- **Dates** are written `YYYY-MM-DD`, for example `2026-10-18`. For birthdays, use the bulletin's year. Only the day number is shown.
- **Order does not matter.** The site sorts dates for you.
- **Commas:** put a comma between items, but **not** after the last item in a list.
- **Quotes:** use plain straight quotes `"like this"`. Quotes pasted from Word or Google Docs (curly quotes) will break the file.
- **A quote mark inside text:** write it as `\"`. Example: `"Say \"hi\" to the apps"`.
- **Brackets:** every `[` needs a closing `]`, and every `{` needs a closing `}`.
- Unknown field names (a typo like `"birthdyas"`) are flagged as warnings in the Actions log, and the field is ignored.

---

## 4. How the site behaves

**Which month is shown**
- The site opens the **newest month that is not in the future**, based on the visitor's date.
- That means you can add next month's bulletin early. It appears when that month starts.
- To open a specific month, add `?m=2026-09` to the address. When there are two or more months, an **Other months** menu also appears in the footer.

**Layout**
- The header, background, reminders (to the right of the header), image (at the bottom) and footer are the same every month.
- The middle holds up to four boxes: Org Dates, UP Dates, Birthdays and Important Links. They line up in rows and wrap by themselves.
- A box with no items disappears, and the others use the space.
- A box with more than 6 items becomes wider and splits into two columns (three at most), so the page stays short.
- Reminders split into two columns after 6 items.
- On phones, everything stacks in one column.
- The picture is cropped to fit, never stretched. If there is no `image.jpg`, the picture area is hidden.

**When something is wrong**
- If a month's data has a typo, the site shows the previous month and a short notice at the top, instead of a blank page.
- If a date is not a real date, or a name or label is empty, that single item is skipped.
- Links that are not web addresses are dropped.
- All text from `data.json` is shown as plain text, so it cannot break the page.

---

## 5. Preview on your computer (optional)

You do not need this. It is only for checking your work before saving to GitHub.

1. Install **Node.js** (version 18 or newer) from https://nodejs.org.
2. Open a terminal in this folder and run:
   ```
   node scripts/serve.js
   ```
3. Open http://localhost:8000 in your browser. Refresh after each edit.

To only check the data files for mistakes, without a browser:
```
node scripts/build.js
```

Do **not** double-click `index.html` to open it. Browsers block a page from reading data files that way, so you would see a blank bulletin.

---

## 6. Changing the look

- **Colors, fonts and spacing:** the variables at the top of `assets/style.css`.
  - The font is Montserrat (loaded from Google Fonts). It is my best guess at your design. Change `--font` if you use another.
- **Footer links** (Facebook, X, Instagram, email): `index.html`, near the bottom.
- **Header title or org name:** `index.html`, near the top.
- **Section names** ("Org Dates", "Birthdays", and so on): `assets/app.js`, in the `render` function.

---

## 7. Troubleshooting

| What you see | What to do |
|---|---|
| Actions run has a red X | Click it and read the message. It names the file and what to fix. |
| The deploy step fails with a "Pages" or "Not Found" error | Step 4 of setup was not done. Turn on Pages with Source set to **GitHub Actions**, then use **Run workflow** again. |
| Site shows "No bulletin has been published yet" | There is no valid `bulletins/YYYY-MM/data.json`. Check the folder name (for example `2026-10`) and that the Actions run is green. |
| The site shows last month instead of this month | A notice at the top says why. Usually the new `data.json` has a typo. Check the Actions run. Also remember the site hides future months. |
| The picture is missing | The file must be named exactly `image.jpg` (lowercase, JPEG) and sit inside the month's folder. The check log warns about wrong names such as `image.png` or `Image.JPG`. |
| Your change is not showing | Wait a couple of minutes, then refresh with `Ctrl + F5` (or `Cmd + Shift + R` on Mac). Also check the Actions run is green. |
| A page is blank when opened from your computer | Use `node scripts/serve.js` (Section 5), not a double-click. |
| The Pages setting is missing or greyed out | You need admin access. On the free plan the repository must be **Public**. |

---

## 8. Good to know

**The site is public.**
- Anyone with the link can see it, and search engines may find it.
- Birthdays and links are visible to everyone. Ask members first before listing their birthday.
- Do not put anything private on it, such as a link that must stay secret.

**Saving is permanent history.**
- GitHub keeps every earlier version of every file. If you make a mistake, open the file's **History** and go back.

**Costs.**
- GitHub Actions is free for public repositories using standard GitHub-hosted runners.
- This project uses nothing paid.

---

## 9. What is in this folder

```
index.html                  The page (header, footer, empty slots)
assets/
  style.css                 Colors, fonts, layout
  app.js                    Reads data.json and draws the page
  logo.svg                  PLACEHOLDER logo. Replace it.
bulletins/
  2026-09/
    data.json               September 2026 content
    image.jpg               PLACEHOLDER picture. Replace it.
  index.json                List of months (made automatically, not saved in the repo)
template/
  data.json                 Blank starting point for a new month
scripts/
  build.js                  Checks data files and makes the month list
  serve.js                  Local preview (optional)
.github/workflows/
  deploy.yml                The robot: checks your data, then publishes the site
package.json, .gitignore    Housekeeping
```

---

## 10. Placeholders and assumptions

Please review these.

- **Logo:** `assets/logo.svg` is a plain placeholder. Your real logo was not available to me.
- **Picture:** `bulletins/2026-09/image.jpg` is a generated placeholder. I did not reuse the party poster artwork.
- **September data:** typed from your Canva screenshot. Please double-check the names, dates and the six link addresses.
- **AKWE and the Acquaintance Party:** both appear on 18 September, but I did not assume they are the same event. The September data lists only "AKWE" as the org date, as in your original.
- **UP Dates:** I treated these as university-wide dates. The September sample has none, so that box does not appear.
- **Font:** a guess (Montserrat). See Section 6.
- **Template:** `template/data.json` has deliberately invalid placeholder dates (`2026-10-00`). If you forget to replace them, the check fails and tells you which item to fix.
