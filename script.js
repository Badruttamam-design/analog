let prayerTimesData = {};  // Menyimpan data waktu azan
let isAdzanRunning = false; // Status apakah adzan sedang berlangsung
let isCurrentlyPrayerTime = false; // Status untuk mengubah warna particles
let currentProgressCircle = null; // Reference ke progress circle element
let userLatitude = null;  // Menyimpan latitude user
let userLongitude = null; // Menyimpan longitude user

// Generate Tick Marks for Clock
function createTickMarks() {
    const tickContainer = document.querySelector('.tick-marks');
    if (!tickContainer) return;

    for (let i = 0; i < 60; i++) {
        const tick = document.createElement('div');
        tick.className = 'tick';

        // Every 5th tick is an hour mark
        if (i % 5 === 0) {
            tick.classList.add('hour');
        }

        // Rotate each tick
        tick.style.transform = `rotate(${i * 6}deg)`;
        tickContainer.appendChild(tick);
    }
}

// Call createTickMarks when page loads
createTickMarks();

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(getAzanTimes, showError);
    } else {
        alert("Geolocation tidak tersedia di browser Anda.");
    }
}

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("Pengguna menolak permintaan geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Lokasi tidak dapat diambil.");
            break;
        case error.TIMEOUT:
            alert("Waktu untuk mengambil lokasi habis.");
            break;
        case error.UNKNOWN_ERROR:
            alert("Terjadi kesalahan yang tidak diketahui.");
            break;
    }
}

function getAzanTimes(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Store coordinates for later use (for calendar date-specific prayer times)
    userLatitude = latitude;
    userLongitude = longitude;

    // 1. Panggil fungsi cuaca langsung
    getWeather(latitude, longitude);

    // 2. Ambil Waktu Sholat dari Aladhan API (PENTING)
    const prayerUrl = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=3&timezone=${timezone}`;

    fetch(prayerUrl)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                const prayerTimes = data.data.timings;

                const today = new Date();
                const isFriday = today.getDay() === 5;
                const dhuhurLabel = isFriday ? "Jumat" : "Dhuhur";

                prayerTimesData = {
                    "Imsak": prayerTimes.Imsak,
                    "Subuh": prayerTimes.Fajr,
                    [dhuhurLabel]: prayerTimes.Dhuhr,
                    "Ashar": prayerTimes.Asr,
                    "Maghrib": prayerTimes.Maghrib,
                    "Isya": prayerTimes.Isha
                };

                console.log("Prayer Times Data:", prayerTimesData);

                document.getElementById("imsak").textContent = `IMSAK ${prayerTimes.Imsak}`;
                document.getElementById("subuh").textContent = `SUBUH ${prayerTimes.Fajr}`;
                document.getElementById("dhuhur").textContent = `${dhuhurLabel.toUpperCase()} ${prayerTimes.Dhuhr}`;
                document.getElementById("ashar").textContent = `ASHAR ${prayerTimes.Asr}`;
                document.getElementById("maghrib").textContent = `MAGHRIB ${prayerTimes.Maghrib}`;
                document.getElementById("isya").textContent = `ISYA ${prayerTimes.Isha}`;

                updateClock();
            } else {
                alert("Terjadi kesalahan dalam mengambil data waktu azan.");
            }
        })
        .catch(error => {
            console.error("Error fetching azan times: ", error);
            alert("Terjadi kesalahan saat mengambil data waktu azan (Cek koneksi internet).");
        });

    // 3. Ambil Nama Lokasi (Opsional - Tidak memblokir fitur utama jika gagal)
    const geocodingUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

    fetch(geocodingUrl)
        .then(response => response.json())
        .then(data => {
            const address = data.address;
            const village = address.village || address.hamlet || '';
            const city = address.city || address.town || address.locality || '';
            const state = address.state || ''; // Provinsi

            // Format lokasi yg lebih rapi - selalu tampilkan provinsi jika ada
            let locationText = '';
            if (village) locationText += village;
            if (city) locationText += (locationText ? ', ' : '') + city;
            if (state) locationText += (locationText ? ', ' : '') + state;
            if (!locationText) locationText = "Lokasi Terdeteksi";

            const locationElement = document.getElementById('location');
            if (locationElement) {
                locationElement.textContent = locationText;
            }
        })
        .catch(error => {
            console.error("Error fetching location name:", error);
            // Jangan alert ke user, cukup log error saja agar tidak mengganggu
            const locationElement = document.getElementById('location');
            if (locationElement) locationElement.textContent = "Lat: " + latitude.toFixed(2) + ", Lon: " + longitude.toFixed(2);
        });
}

function convertToSeconds(timeString) {
    if (!timeString) {
        console.error("Invalid timeString:", timeString);
        return 0;
    }

    const timeParts = timeString.split(':');
    if (timeParts.length === 2) {
        return parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60;
    } else {
        console.error("Invalid time format:", timeString);
        return 0;
    }
}

// Fungsi Text-to-Speech untuk pengumuman waktu sholat
function speakPrayerAnnouncement(prayerName) {
    if ('speechSynthesis' in window) {
        // Stop any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(
            `Sekarang masuk waktu ${prayerName}`
        );
        utterance.lang = 'id-ID';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        window.speechSynthesis.speak(utterance);
    }
}

// Fungsi Update Progress Bar
function updateProgressBar(secondsUntilNextPrayer, totalSecondsBetweenPrayers) {
    if (!currentProgressCircle) {
        currentProgressCircle = document.querySelector('.progress-ring-circle');
    }

    if (currentProgressCircle && totalSecondsBetweenPrayers > 0) {
        const circumference = 2 * Math.PI * 262; // r = 262
        const progress = 1 - (secondsUntilNextPrayer / totalSecondsBetweenPrayers);
        const offset = circumference * (1 - progress);

        currentProgressCircle.style.strokeDashoffset = offset;

        // Change color when near prayer time (< 3 minutes)
        if (secondsUntilNextPrayer < 180) {
            currentProgressCircle.classList.add('near-prayer');
        } else {
            currentProgressCircle.classList.remove('near-prayer');
        }
    }
}

// Fungsi Countdown Effects
function updateCountdownEffects(secondsUntilNextPrayer, nextPrayer) {
    const clockContainer = document.querySelector('.clock-container');
    const countdownAlert = document.getElementById('countdown-alert');

    // Activate pulse animation when < 3 minutes
    if (secondsUntilNextPrayer < 180 && secondsUntilNextPrayer > 0) {
        if (clockContainer && !clockContainer.classList.contains('countdown-active')) {
            clockContainer.classList.add('countdown-active');
        }

        // Show countdown notification
        if (countdownAlert) {
            const minutes = Math.floor(secondsUntilNextPrayer / 60);
            const seconds = secondsUntilNextPrayer % 60;
            countdownAlert.textContent = `⏰ ${nextPrayer} dalam ${minutes}:${String(seconds).padStart(2, '0')}`;
            countdownAlert.classList.add('show', 'pulse');
        }
    } else {
        if (clockContainer) {
            clockContainer.classList.remove('countdown-active');
        }
        if (countdownAlert) {
            countdownAlert.classList.remove('show', 'pulse');
        }
    }
}

function showPrayerTimeMessage(hours, minutes, seconds) {
    const currentTimeInSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
    let nextPrayer = null;
    let currentPrayer = null;
    let previousPrayer = null;
    let previousPrayerTime = null;

    for (const [prayer, time] of Object.entries(prayerTimesData)) {
        const prayerTimeInSeconds = convertToSeconds(time);

        if (prayerTimeInSeconds === currentTimeInSeconds) {
            currentPrayer = prayer;
        } else if (prayerTimeInSeconds > currentTimeInSeconds && !nextPrayer) {
            nextPrayer = prayer;
        } else if (prayerTimeInSeconds < currentTimeInSeconds) {
            previousPrayer = prayer;
            previousPrayerTime = time;
        }
    }

    if (!nextPrayer) {
        nextPrayer = "Imsak";
        previousPrayer = Object.keys(prayerTimesData)[Object.keys(prayerTimesData).length - 1];
        previousPrayerTime = prayerTimesData[previousPrayer];
    }

    const nextPrayerTime = prayerTimesData[nextPrayer];
    const nextPrayerInSeconds = convertToSeconds(nextPrayerTime);
    let secondsUntilNextPrayer = nextPrayerInSeconds - currentTimeInSeconds;

    if (secondsUntilNextPrayer < 0) {
        secondsUntilNextPrayer += 24 * 3600;
    }

    // Calculate total seconds between previous and next prayer for progress bar
    let totalSecondsBetweenPrayers = 0;
    if (previousPrayerTime) {
        const previousPrayerInSeconds = convertToSeconds(previousPrayerTime);
        totalSecondsBetweenPrayers = nextPrayerInSeconds - previousPrayerInSeconds;
        if (totalSecondsBetweenPrayers < 0) {
            totalSecondsBetweenPrayers += 24 * 3600;
        }
    } else {
        totalSecondsBetweenPrayers = secondsUntilNextPrayer;
    }

    // Update Progress Bar
    updateProgressBar(secondsUntilNextPrayer, totalSecondsBetweenPrayers);

    // Update Countdown Effects
    updateCountdownEffects(secondsUntilNextPrayer, nextPrayer);

    const hoursUntilNextPrayer = Math.floor(secondsUntilNextPrayer / 3600);
    const minutesRemaining = Math.floor((secondsUntilNextPrayer % 3600) / 60);
    const secondsRemaining = secondsUntilNextPrayer % 60;
    const timeRemainingFormatted = `${String(hoursUntilNextPrayer).padStart(2, '0')}:${String(minutesRemaining).padStart(2, '0')}:${String(secondsRemaining).padStart(2, '0')}`;

    const runningText = document.getElementById('runningText');
    const nextPrayerText = document.getElementById('nextPrayerText');
    const audio = document.getElementById('azanAudio');

    if (currentPrayer) {
        if (!isAdzanRunning) { // Mulai Adzan hanya jika belum berjalan
            isAdzanRunning = true;
            isCurrentlyPrayerTime = true; // Ubah warna particles
            updateParticleColors(true); // Update particle colors

            if (currentPrayer === "Imsak") {
                if (runningText) {
                    runningText.innerHTML = `<span>Sekarang Sudah Masuk Waktu Imsak, Segera Bersiap Untuk Puasa!</span>`;
                    runningText.classList.add('running');
                }
                runningText.style.display = "block";
                nextPrayerText.style.display = "none";

                // Text-to-speech untuk Imsak
                speakPrayerAnnouncement("Imsak");

                // Imsak cuma teks sebentar (misal 1 menit)
                setTimeout(() => {
                    isAdzanRunning = false;
                    isCurrentlyPrayerTime = false;
                    updateParticleColors(false);
                    runningText.classList.remove('running');
                    runningText.style.display = "none";
                    nextPrayerText.style.display = "block";
                }, 60000);

            } else {
                if (runningText) {
                    runningText.innerHTML = `<span>Masuk Adzan Sholat ${currentPrayer}</span>`;
                    runningText.classList.add('running');
                }
                runningText.style.display = "block";
                nextPrayerText.style.display = "none";

                // Text-to-speech announcement
                speakPrayerAnnouncement(currentPrayer);

                audio.src = currentPrayer === "Subuh" ? "azan_subuh.mp3" : "adan.mp3";
                audio.currentTime = 0;

                audio.play()
                    .catch(err => console.error("Audio playback error:", err)); // Error handling

                // Event ketika audio selesai (durasi dinamis sesuai file mp3)
                audio.onended = function () {
                    console.log("Adzan selesai.");
                    isAdzanRunning = false;
                    isCurrentlyPrayerTime = false;
                    updateParticleColors(false);
                    runningText.classList.remove('running');
                    runningText.style.display = "none";
                    nextPrayerText.style.display = "block";
                };

                // Fallback 4 menit (240 detik) jaga2 kalau onended tidak nembak
                setTimeout(() => {
                    if (isAdzanRunning) {
                        isAdzanRunning = false;
                        isCurrentlyPrayerTime = false;
                        updateParticleColors(false);
                        runningText.classList.remove('running');
                        runningText.style.display = "none";
                        nextPrayerText.style.display = "block";
                    }
                }, 240000);
            }
        }
    } else {
        // Jika TIDAK ada match jam sholat, cek apakah adzan sedang jalan?
        if (!isAdzanRunning) {
            // Normal mode: Tampilkan Next Prayer
            runningText.style.display = "none";

            if (nextPrayer === "Imsak") {
                if (nextPrayerText)
                    nextPrayerText.textContent = `Imsak - ${timeRemainingFormatted}`;
            } else {
                if (nextPrayerText)
                    nextPrayerText.textContent = `${nextPrayer} - ${timeRemainingFormatted}`;
            }
            nextPrayerText.style.display = "block";
        }
        // JIKA isAdzanRunning == true, skip update tampilan (biarkan teks adzan stay)
    }
}

let audioStarted = false;
function playAudioAtSpecificTime() {
    const currentTime = new Date();
    const targetHour = 3;
    const targetMinute = 1;

    if (currentTime.getHours() === targetHour && currentTime.getMinutes() === targetMinute && !audioStarted) {
        const audio = document.getElementById('azanAudio');
        audio.src = "doa.mp3";
        audio.currentTime = 0;


        const playEndTime = Date.now() + (5 * 60 * 1000);

        function playAudioLoop() {
            if (Date.now() >= playEndTime) {
                audio.pause();
                audioStarted = false;
                return;
            }
            audio.play();
            audio.onended = function () {
                audio.currentTime = 0;
                playAudioLoop();
            };
        }
        playAudioLoop();
        audioStarted = true;
    }
}


function updateClock() {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours();

    const digitalClock = document.getElementById('digital-clock');
    digitalClock.innerHTML = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:<span class="seconds">${String(seconds).padStart(2, '0')}</span>`;

    const hourDeg = (hours % 12) * 30 + (minutes / 60) * 30;
    const minuteDeg = (minutes * 6);
    const secondDeg = (seconds * 6);

    const hourHand = document.querySelector('.hour-hand');
    const minuteHand = document.querySelector('.minute-hand');
    const secondHand = document.querySelector('.second-hand');

    if (hourHand) hourHand.style.transform = `rotate(${hourDeg}deg)`;
    if (minuteHand) minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
    if (secondHand) secondHand.style.transform = `rotate(${secondDeg}deg)`;

    showPrayerTimeMessage(hours, minutes, seconds);

    const dateElement = document.getElementById('date');
    const day = now.getDate();
    const monthIndex = now.getMonth();
    const year = now.getFullYear();
    const dayIndex = now.getDay();

    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const days = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    dateElement.innerText = `${days[dayIndex]}, ${String(day).padStart(2, '0')} ${months[monthIndex]} ${year}`;

    playAudioAtSpecificTime();

    const islamicDate = moment().format('iD iMMMM iYYYY');

    const islamicDateArabic = islamicDate.split(' ').map(item => {
        if (item.match(/\d/)) {
            return convertToArabicNumerals(item);
        }
        return item;
    }).join(' ');

    const islamicDateWithComma = islamicDateArabic.replace(/(\d+)( ,)/g, '$1 ,');

    const islamicDateElement = document.getElementById('islamic-date');
    if (islamicDateElement) {
        islamicDateElement.innerText = `${islamicDateWithComma}`;
    }
}

function convertToArabicNumerals(number) {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(number).split('').map(digit => arabicNumerals[digit]).join('');
}

// Fungsi Mengambil Cuaca dari Open-Meteo
function getWeather(lat, lon) {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    fetch(weatherUrl)
        .then(response => response.json())
        .then(data => {
            if (data.current_weather) {
                const temp = data.current_weather.temperature;
                const weatherCode = data.current_weather.weathercode;

                // Mapping kode cuaca sederhana (WMO code)
                let weatherDesc = "Cerah";
                let icon = "☀️";

                // Kode WMO: https://open-meteo.com/en/docs
                if (weatherCode >= 1 && weatherCode <= 3) {
                    weatherDesc = "Berawan"; icon = "⛅";
                } else if (weatherCode >= 45 && weatherCode <= 48) {
                    weatherDesc = "Kabut"; icon = "🌫️";
                } else if (weatherCode >= 51 && weatherCode <= 67) {
                    weatherDesc = "Gerimis"; icon = "🌧️";
                } else if (weatherCode >= 71 && weatherCode <= 77) {
                    weatherDesc = "Salju"; icon = "❄️";
                } else if (weatherCode >= 80 && weatherCode <= 99) {
                    weatherDesc = "Hujan/Badai"; icon = "⛈️";
                }

                const weatherElement = document.getElementById('weather-info');
                if (weatherElement) {
                    weatherElement.innerHTML = `${icon} ${weatherDesc} | ${temp}°C`;
                }
            }
        })
        .catch(error => {
            console.error("Gagal mengambil data cuaca:", error);
        });
}

// Fungsi untuk update warna particles
function updateParticleColors(isPrayerTime) {
    if (window.pJSDom && window.pJSDom.length > 0) {
        const pJS = window.pJSDom[0].pJS;

        if (isPrayerTime) {
            // Warna gradasi saat waktu sholat - lebih banyak warna
            pJS.particles.color.value = ["#00d9ff", "#ee00ff", "#2f2dca", "#ffd700", "#00ffcc", "#ff6b9d"];
            pJS.particles.line_linked.color = "#ee00ff";
        } else {
            // Warna default - tambah pink dan kuning
            pJS.particles.color.value = ["#00d9ff", "#ff69b4", "#ffeb3b"];
            pJS.particles.line_linked.color = "#00d9ff";
        }

        // Refresh particles dengan warna baru
        if (pJS.fn && pJS.fn.particlesRefresh) {
            pJS.fn.particlesRefresh();
        }
    }
}

// ====================================
// CALENDAR FUNCTIONALITY
// ====================================

let currentCalendarDate = new Date();

// Calendar Elements
const calendarToggle = document.getElementById('calendar-toggle');
const miniCalendar = document.getElementById('mini-calendar');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const closeCalendarBtn = document.getElementById('close-calendar');
const calendarDatesContainer = document.getElementById('calendar-dates');
const calendarMonthYear = document.getElementById('calendar-month-year');
const calendarHijriMonth = document.getElementById('calendar-hijri-month');
const prayerPopup = document.getElementById('prayer-popup');
const popupClose = document.querySelector('.popup-close');

// Toggle Calendar Visibility
if (calendarToggle) {
    calendarToggle.addEventListener('click', () => {
        miniCalendar.classList.toggle('hidden');
        if (!miniCalendar.classList.contains('hidden')) {
            generateCalendar(currentCalendarDate);
        }
    });
}

// Close Calendar
if (closeCalendarBtn) {
    closeCalendarBtn.addEventListener('click', () => {
        miniCalendar.classList.add('hidden');
    });
}

// Month Navigation
if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        generateCalendar(currentCalendarDate);
    });
}

if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        generateCalendar(currentCalendarDate);
    });
}

// Close Prayer Popup
if (popupClose) {
    popupClose.addEventListener('click', () => {
        prayerPopup.classList.add('hidden');
    });
}

// Close popup when clicking outside
if (prayerPopup) {
    prayerPopup.addEventListener('click', (e) => {
        if (e.target === prayerPopup) {
            prayerPopup.classList.add('hidden');
        }
    });
}

// Generate Calendar Function
function generateCalendar(date) {
    if (!calendarDatesContainer) return;

    const year = date.getFullYear();
    const month = date.getMonth();

    // Update header
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    if (calendarMonthYear) {
        calendarMonthYear.textContent = `${monthNames[month]} ${year}`;
    }

    // Get Hijri month for the first day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    const hijriDate = moment(firstDayOfMonth).format('iMMMM iYYYY');
    if (calendarHijriMonth) {
        calendarHijriMonth.textContent = hijriDate;
    }

    // Clear previous dates
    calendarDatesContainer.innerHTML = '';

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Get today's date for highlighting
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    // Add previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayNum = daysInPrevMonth - i;
        const dateDiv = createDateElement(dayNum, year, month - 1, true);
        calendarDatesContainer.appendChild(dateDiv);
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = isCurrentMonth && day === todayDate;
        const dateDiv = createDateElement(day, year, month, false, isToday);
        calendarDatesContainer.appendChild(dateDiv);
    }

    // Add next month's leading days to fill the grid
    const totalCells = calendarDatesContainer.children.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days = 42 cells max
    for (let day = 1; day <= remainingCells && totalCells < 42; day++) {
        const dateDiv = createDateElement(day, year, month + 1, true);
        calendarDatesContainer.appendChild(dateDiv);
    }
}

// Create Date Element
function createDateElement(day, year, month, isOtherMonth = false, isToday = false) {
    const dateDiv = document.createElement('div');
    dateDiv.className = 'calendar-date';

    if (isOtherMonth) {
        dateDiv.classList.add('other-month');
    }

    if (isToday) {
        dateDiv.classList.add('today');
    }

    // Check if Friday
    const date = new Date(year, month, day);
    if (date.getDay() === 5 && !isOtherMonth) {
        dateDiv.classList.add('friday');
    }

    // Gregorian date number
    const dateNumber = document.createElement('div');
    dateNumber.className = 'date-number';
    dateNumber.textContent = day;
    dateDiv.appendChild(dateNumber);

    // Hijri date
    const hijriDate = moment(date).format('iD');
    const hijriDiv = document.createElement('div');
    hijriDiv.className = 'date-hijri';
    hijriDiv.textContent = convertToArabicNumerals(hijriDate);
    dateDiv.appendChild(hijriDiv);

    // Click event to show prayer times
    if (!isOtherMonth) {
        dateDiv.addEventListener('click', () => {
            showPrayerTimesPopup(date);
        });
    }

    return dateDiv;
}

// Show Prayer Times Popup for selected date
function showPrayerTimesPopup(date) {
    if (!prayerPopup) return;

    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const dayName = dayNames[date.getDay()];

    // Update popup date
    const popupDateEl = document.getElementById('popup-date');
    if (popupDateEl) {
        popupDateEl.textContent = `${dayName}, ${day} ${month} ${year}`;
    }

    // Update Hijri date
    const hijriFullDate = moment(date).format('iD iMMMM iYYYY');
    const hijriDateArabic = hijriFullDate.split(' ').map(item => {
        if (item.match(/\d/)) {
            return convertToArabicNumerals(item);
        }
        return item;
    }).join(' ');

    const popupHijriEl = document.getElementById('popup-hijri-date');
    if (popupHijriEl) {
        popupHijriEl.textContent = hijriDateArabic;
    }

    // Show loading state
    document.getElementById('popup-imsak').textContent = '...';
    document.getElementById('popup-subuh').textContent = '...';
    document.getElementById('popup-dhuhur').textContent = '...';
    document.getElementById('popup-ashar').textContent = '...';
    document.getElementById('popup-maghrib').textContent = '...';
    document.getElementById('popup-isya').textContent = '...';

    // Show popup immediately with loading state
    prayerPopup.classList.remove('hidden');

    // Check if we have user location
    if (!userLatitude || !userLongitude) {
        console.error('User location not available');
        document.getElementById('popup-imsak').textContent = '--:--';
        document.getElementById('popup-subuh').textContent = '--:--';
        document.getElementById('popup-dhuhur').textContent = '--:--';
        document.getElementById('popup-ashar').textContent = '--:--';
        document.getElementById('popup-maghrib').textContent = '--:--';
        document.getElementById('popup-isya').textContent = '--:--';
        return;
    }

    // Format date for API (DD-MM-YYYY)
    const dateStr = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Fetch prayer times for specific date
    const prayerUrl = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${userLatitude}&longitude=${userLongitude}&method=3&timezone=${timezone}`;

    fetch(prayerUrl)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                const prayerTimes = data.data.timings;

                document.getElementById('popup-imsak').textContent = prayerTimes.Imsak || '--:--';
                document.getElementById('popup-subuh').textContent = prayerTimes.Fajr || '--:--';
                document.getElementById('popup-dhuhur').textContent = prayerTimes.Dhuhr || '--:--';
                document.getElementById('popup-ashar').textContent = prayerTimes.Asr || '--:--';
                document.getElementById('popup-maghrib').textContent = prayerTimes.Maghrib || '--:--';
                document.getElementById('popup-isya').textContent = prayerTimes.Isha || '--:--';
            } else {
                console.error('Error fetching prayer times for date:', data);
                document.getElementById('popup-imsak').textContent = '--:--';
                document.getElementById('popup-subuh').textContent = '--:--';
                document.getElementById('popup-dhuhur').textContent = '--:--';
                document.getElementById('popup-ashar').textContent = '--:--';
                document.getElementById('popup-maghrib').textContent = '--:--';
                document.getElementById('popup-isya').textContent = '--:--';
            }
        })
        .catch(error => {
            console.error('Error fetching prayer times:', error);
            document.getElementById('popup-imsak').textContent = '--:--';
            document.getElementById('popup-subuh').textContent = '--:--';
            document.getElementById('popup-dhuhur').textContent = '--:--';
            document.getElementById('popup-ashar').textContent = '--:--';
            document.getElementById('popup-maghrib').textContent = '--:--';
            document.getElementById('popup-isya').textContent = '--:--';
        });
}

// Initialize calendar on load
if (miniCalendar) {
    generateCalendar(currentCalendarDate);
}

setInterval(updateClock, 1000);
updateClock();

getLocation();
