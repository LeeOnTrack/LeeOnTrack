# LeeOnTrack Website

This is the simple static website for LeeOnTrack, an iRacing sim racing league.

## What is this project?

This repository contains the source files for the LeeOnTrack website. It is a single-page site with information about Lee, the sim rig, the Sunday night league, race nights, a gallery, a code of conduct, and how to join.

## Technology used

- HTML5
- CSS3
- Vanilla JavaScript

No frameworks, build tools, or server-side code are used. This makes the site easy to maintain and host directly from GitHub Pages.

## Folder structure

```text
lot/
├── index.html        # Main page
├── privacy.html      # Privacy policy
├── terms.html        # Terms and conditions
├── assets/
│   ├── css/
│   │   └── styles.css    # Styling and design system
│   ├── js/
│   │   └── main.js       # Small interactive features
│   ├── images/           # Images, logos and favicon
│   └── icons/            # Icons
├── .gitignore        # Files to ignore
└── README.md         # This file
```

## How to run it locally

Because this is a static website, you do not need any special tools. The easiest way is:

1. Open the project folder on your computer.
2. Double-click `index.html` to open it in your browser.

Or, if you prefer, you can run a small local web server from the project folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## How to make future changes

1. Edit `index.html` to change the page content and sections.
2. Edit `assets/css/styles.css` to change the colours, spacing, or layout.
3. Edit `assets/js/main.js` to add or change interactive features.
4. Save your changes and refresh the browser to see them.

## How to update common content

### Next race banner

The next race message appears in two places in `index.html`:

- **Desktop banner** below the header: edit the `.next-race-banner__date` `<span>` (around the `.next-race-banner--desktop` section).
- **Mobile header** message: edit the `.next-race-message__date` `<span>` inside the `<header>`.

### Race night cards

In `index.html`, find the `#race-night` section. Update the `dd` values inside the `.race-night__details` lists for the **Next Race** and **Following Race** cards.

### Gallery images

Each gallery item in `index.html` is a `<button class="gallery__card">`. For each image:

1. Replace the `data-src` value with the path to the full-size image.
2. Add a modifier class (e.g. `.gallery__media--your-image`) in `assets/css/styles.css` with `background-image: url('../images/...')`, and apply it alongside `gallery__media` on the `<span>`. Inline `style=` attributes are blocked by the Content Security Policy, so always use a class.
3. Update `data-title` and `data-desc` for the lightbox title and description.
4. Update the visible `.gallery__title` and `.gallery__desc` `<span>` text.

## Social media links

Social media links are in the footer and hero of `index.html`. They currently use the following placeholder URLs:

- **Discord:** `https://discord.gg/DKzfz8Q8Pd`
- **Facebook:** `https://www.facebook.com/LeeOnTrack`
- **YouTube:** `https://www.youtube.com/@LeeOnTrack-j9v`
- **TikTok:** `https://www.tiktok.com/@leeontrack?_r=1&_t=ZN-93EGUP48d8g`

Replace these placeholder URLs with the real LeeOnTrack social media URLs. The icons are provided by [Font Awesome](https://fontawesome.com/) via a CDN link in `index.html`.

## How to deploy to GitHub Pages

This site uses the repository already connected to GitHub (`https://github.com/locobean/lot.git`). To publish:

1. Push your changes to the `main` branch.
2. In the GitHub repository settings, go to **Pages**.
3. Under **Source**, select **Deploy from a branch** and choose `main` with the `/(root)` folder.
4. Save. The site will be available at `https://locobean.github.io/lot/`.
