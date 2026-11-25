CHAIN REACTION CARNIVAL
Quizmas Season 3 · Game Hub · Fun game (open from every skill track)

WHAT IS IN THIS FOLDER
  index.html        The game (open this page to play)
  dashboard/        Fun Games Dashboard (password protected; shows only the two fun games)
  js/config.js      Settings: score sheet link, ride times, tries, "Back to my track" links
  css/, js/, fonts/, vendor/   Game files (do not rename)

PUT IT ONLINE (GITHUB + NETLIFY)
  1. Create an empty GitHub repository, e.g. quizmas-chain-reaction.
  2. Upload everything INSIDE this folder (not the folder itself).
  3. In Netlify: Add new site > Import an existing project > GitHub > pick the repository.
     Leave the build command and publish directory empty, then Deploy.

CONNECT THE SCORE SHEET
  Use the SAME Google Sheet and Web app link as the other Quizmas games. Paste the link into
  js/config.js as SHEETS_URL. Also update the sheet's script to version 2 (Code.gs in this
  package) so fun-game scores go to their own "Fun Scores" tab. Until the link is added,
  scores are kept safely on each device and sent automatically later.

OPENING IT FROM EACH SKILL TRACK (one game, three doorways)
  Link to the same game address from every track, adding where the student came from:
    https://YOUR-SITE.netlify.app/?from=graphics
    https://YOUR-SITE.netlify.app/?from=coding
    https://YOUR-SITE.netlify.app/?from=video
  Put each track's page address in TRACK_LINKS in js/config.js and the results screen shows a
  "Back to Graphic Design" (or Coding / Video Editing) button.

GAME RULES
  Three rides: Ring the Jingle Bell (70 s), Pop the Present Balloon (80 s), Light the Christmas Star (100 s).
  Drag ramps, dominoes, springs and baubles onto the glowing spots, tap ramps and springs to flip them,
  then press "Set it off!". Three tries per ride; the best try counts.
  Each ride is out of 100:
    Chain reaction (2 or more of your pieces join in)   50   (one piece: 25)
    Reaching the target                                30
    Fewer pieces bonus (par or fewer)                  10
    Speedy bonus (solved with a third of the time left) 10
  Final score = average of the three rides (out of 100). Every play is saved; the dashboard shows each
  student's best score. Fun-game scores are kept apart from the skill-based scores.

TESTING SWITCHES (for staff only)
  index.html?skip=1       jump straight into the rides as "Test Player" (TEST-1)
  index.html?ride=3       start at ride 3 (works with skip=1)
  index.html?fast=1       12-second rides, for quickly checking the flow

CREDITS
  Matter.js physics (MIT), GSAP (GreenSock standard no-charge licence), SheetJS (Apache 2.0).
  Fonts (SIL Open Font Licence): Bungee, Baloo 2, Nunito.
  All pieces, illustrations, sounds and music are original to this game.
