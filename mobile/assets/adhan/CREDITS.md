# Adhan recordings

Played at prayer time (src/adhan.js) and, in the Android APK, used as the sound of the prayer
notification (copied into the APK by the expo-notifications plugin, app.json). Each file was trimmed of
silence at the start, loudness-normalised to -16 LUFS (true peak -1.5 dB), given a 1.5 s fade-out and saved
as mono 64 kbps MP3 with ffmpeg. Android resource names must stay `[a-z0-9_]`.

| File | Recording | Source | Licence |
| --- | --- | --- | --- |
| adhan_makkah.mp3 | Adhan at Masjid al-Haram, Makkah, 21 January 2013, recorded by Seyfula Islam | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Adhan,_Great_Mosque_of_Mecca_-_Jan_21,_2013.webm) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |
| adhan_madinah.mp3 | Call to prayer from the Prophet's Mosque, Madinah, recorded by ejaz215 (freesound 33937) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:33937_ejaz215_call-to-prayer-from-the-prophet-s-mo.ogg) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |
| adhan_melodic.mp3 | "Beautiful adhan", own work by Adam-synagda (2022) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

Wikimedia Commons can't be reached from the build container, so the files were taken from copies in two
open-source prayer apps that record the same Commons sources and licences:
yassindaboussi/Salaty (src/assets/adhan/, Makkah and Madinah) and MohammdKopa/prayer-time-app
(mobile/assets/sounds/adhan_full.ogg, the melodic one). Before selling the app, check each Commons page
once more. The CC BY files are credited in the app (Prayer times and the settings note).

Not used: recordings from "free adhan" collections on GitHub (Mishary Alafasy, Makkah muezzins and so on)
that state no licence; a performance is copyrighted unless its owner says otherwise. None of the three is a
Fajr adhan with "as-salatu khayrun min an-nawm"; the same adhan plays at Fajr.
