let prayerTimesData = {};  // Menyimpan data waktu azan

// Fungsi untuk mendapatkan lokasi pengguna
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(getAzanTimes, showError);
    } else {
        alert("Geolocation tidak tersedia di browser Anda.");
    }
}

// Fungsi untuk menangani error jika geolocation gagal
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

// Fungsi untuk mendapatkan waktu azan berdasarkan lokasi
function getAzanTimes(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    // Menentukan zona waktu berdasarkan lokasi
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Memanggil API Geocoding untuk mendapatkan alamat lengkap
    const geocodingUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

    fetch(geocodingUrl)
        .then(response => response.json())
        .then(data => {
            const address = data.address;

            // Memastikan lokasi yang tepat berdasarkan alamat
            const village = address.village || address.hamlet || '';
            const city = address.city || address.town || address.locality || '';
            const state = address.state || '';

            // Menyusun alamat dalam format yang lebih tepat
            const location = `${village}, ${city}, ${state}`;

            // Menampilkan lokasi di elemen dengan ID 'location'
            const locationElement = document.getElementById('location');
            if (locationElement) {
                locationElement.textContent = location.trim();
            }

            // Menambahkan parameter 'timezone' pada URL untuk mengatur zona waktu
            const url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=3&timezone=${timezone}`;

            // Memanggil API Aladhan untuk mendapatkan waktu azan
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.code === 200) {
                        const prayerTimes = data.data.timings;

                        // Menyimpan waktu azan ke dalam objek prayerTimes
                        prayerTimesData = {
                            "Imsak": prayerTimes.Imsak,
                            "Subuh": prayerTimes.Fajr,
                            "Dhuhur": prayerTimes.Dhuhr,
                            "Ashar": prayerTimes.Asr,
                            "Maghrib": prayerTimes.Maghrib,
                            "Isya": prayerTimes.Isha
                        };

                        console.log("Prayer Times Data:", prayerTimesData); // Debugging: Menampilkan data waktu azan

                        // Memperbarui tampilan waktu azan di HTML
                        document.getElementById("imsak").textContent = `IMSAK ${prayerTimes.Imsak}`;
                        document.getElementById("subuh").textContent = `SUBUH ${prayerTimes.Fajr}`;
                        document.getElementById("dhuhur").textContent = `DHUHUR ${prayerTimes.Dhuhr}`;
                        document.getElementById("ashar").textContent = `ASHAR ${prayerTimes.Asr}`;
                        document.getElementById("maghrib").textContent = `MAGHRIB ${prayerTimes.Maghrib}`;
                        document.getElementById("isya").textContent = `ISYA ${prayerTimes.Isha}`;

                        updateClock();  // Panggil fungsi untuk memperbarui jam dan waktu azan
                    } else {
                        alert("Terjadi kesalahan dalam mengambil data waktu azan.");
                    }
                })
                .catch(error => {
                    console.error("Error fetching azan times: ", error);
                    alert("Terjadi kesalahan saat mengambil data waktu azan.");
                });
        })
        .catch(error => {
            console.error("Error fetching location:", error);
            alert("Terjadi kesalahan saat mengambil data lokasi.");
        });
}

// Fungsi untuk mengubah waktu azan dari string ke detik
function convertToSeconds(timeString) {
    if (!timeString) {
        console.error("Invalid timeString:", timeString);  // Debugging: Menampilkan error jika timeString tidak valid
        return 0;
    }

    const timeParts = timeString.split(':');
    if (timeParts.length === 2) {
        return parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60;
    } else {
        console.error("Invalid time format:", timeString);  // Debugging: Menampilkan error jika format waktu tidak sesuai
        return 0;
    }
}

// Fungsi untuk menghitung dan menampilkan waktu azan
function showPrayerTimeMessage(hours, minutes, seconds) {
    const currentTimeInSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
    let nextPrayer = null;
    let currentPrayer = null;

    // Mencari waktu adzan saat ini dan selanjutnya
    for (const [prayer, time] of Object.entries(prayerTimesData)) {
        const prayerTimeInSeconds = convertToSeconds(time);

        if (prayerTimeInSeconds === currentTimeInSeconds) {
            currentPrayer = prayer;
        } else if (prayerTimeInSeconds > currentTimeInSeconds && !nextPrayer) {
            nextPrayer = prayer;
        }
    }

    // Jika semua waktu sholat hari ini sudah berlalu, set nextPrayer ke Imsak
    if (!nextPrayer) {
        nextPrayer = "Imsak";
    }

    const nextPrayerTime = prayerTimesData[nextPrayer];
    const nextPrayerInSeconds = convertToSeconds(nextPrayerTime);
    let secondsUntilNextPrayer = nextPrayerInSeconds - currentTimeInSeconds;

    // Logika penyesuaian waktu untuk pergantian hari
    if (secondsUntilNextPrayer < 0) {
        secondsUntilNextPrayer += 24 * 3600;
    }

    const hoursUntilNextPrayer = Math.floor(secondsUntilNextPrayer / 3600);
    const minutesRemaining = Math.floor((secondsUntilNextPrayer % 3600) / 60);
    const secondsRemaining = secondsUntilNextPrayer % 60;
    const timeRemainingFormatted = `${String(hoursUntilNextPrayer).padStart(2, '0')}:${String(minutesRemaining).padStart(2, '0')}:${String(secondsRemaining).padStart(2, '0')}`;

    const runningText = document.getElementById('runningText');
    const nextPrayerText = document.getElementById('nextPrayerText');
    const audio = document.getElementById('azanAudio');

    if (currentPrayer) {
        if (currentPrayer === "Imsak") {
            if (runningText)
                runningText.textContent = "Sekarang Sudah Masuk Waktu Imsak, Segera Bersiap Untuk Puasa!";
            runningText.style.display = "block";
            nextPrayerText.style.display = "none";
        } else {
            if (runningText)
                runningText.textContent = `Sekarang Sudah Masuk Waktu Adzan Sholat ${currentPrayer}!`;
            runningText.style.display = "block";
            nextPrayerText.style.display = "none";

            // Tentukan file audio sesuai dengan waktu sholat
            audio.src = currentPrayer === "Subuh" ? "azan_subuh.mp3" : "adan.mp3";
            audio.currentTime = 0;  // Mulai dari awal

            // Putar audio
            audio.play();

            // Tampilkan pesan selama 60 detik
            setTimeout(() => {
                runningText.style.display = "none"; // Menyembunyikan setelah 60 detik
            }, 60000); // 60000 ms = 60 detik
        }
    } else {
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
}

let audioStarted = false; // Flag untuk memastikan audio hanya dimainkan sekali
// Audio doa
function playAudioAtSpecificTime() {
    const currentTime = new Date();
    const targetHour = 3;
    const targetMinute = 1;
    
    // Mengecek apakah sekarang tepat pukul 3:01 dan audio belum diputar
    if (currentTime.getHours() === targetHour && currentTime.getMinutes() === targetMinute && !audioStarted) {
        const audio = document.getElementById('azanAudio');
        audio.src = "doa.mp3";  
        audio.currentTime = 0; // Mulai dari awal

        // Tentukan waktu pemutaran selama 5 menit
        const playEndTime = Date.now() + (5 * 60 * 1000); // 5 menit = 5 * 60 * 1000 ms
        
        // Fungsi untuk memutar audio dalam loop selama 5 menit
        function playAudioLoop() {
            if (Date.now() >= playEndTime) {
                audio.pause();  // Hentikan audio setelah 5 menit
                audioStarted = false; // Reset flag setelah selesai
                return;
            }

            audio.play();  // Putar audio
            audio.onended = function() {
                audio.currentTime = 0;  // Mulai dari awal
                playAudioLoop();  // Panggil lagi untuk memutar audio berulang
            };
        }

        // Mulai loop audio
        playAudioLoop();
        audioStarted = true; // Tandai audio sudah diputar
    }
}


// Fungsi untuk memperbarui jam dan menampilkan waktu azan
function updateClock() {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours();

    // Update digital clock
    const digitalClock = document.getElementById('digital-clock');
    digitalClock.innerHTML = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:<span class="seconds">${String(seconds).padStart(2, '0')}</span>`;

    // Update jam analog (rotasi jarum jam)
    const hourDeg = (hours % 12) * 30 + (minutes / 60) * 30;  // 30 deg per jam + fractional jam untuk menit
    const minuteDeg = (minutes * 6);  // 6 deg per menit
    const secondDeg = (seconds * 6);  // 6 deg per detik

    const hourHand = document.querySelector('.hour-hand');
    const minuteHand = document.querySelector('.minute-hand');
    const secondHand = document.querySelector('.second-hand');

    if (hourHand) hourHand.style.transform = `rotate(${hourDeg}deg)`;
    if (minuteHand) minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
    if (secondHand) secondHand.style.transform = `rotate(${secondDeg}deg)`;

    // Perbarui pesan waktu sholat
    showPrayerTimeMessage(hours, minutes, seconds);

    // Cek dan putar audio pada waktu yang ditentukan (3:01)
    playAudioAtSpecificTime();

    // Update date
    const dateElement = document.getElementById('date');
    const day = now.getDate();
    const monthIndex = now.getMonth();
    const year = now.getFullYear();
    const dayIndex = now.getDay();

    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const days = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    dateElement.innerText = `${days[dayIndex]}, ${String(day).padStart(2, '0')} ${months[monthIndex]} ${year}`;
}

// Update jam setiap detik
setInterval(updateClock, 1000);
updateClock(); // Initial call to set the clock immediately

// Panggil fungsi untuk mendapatkan lokasi dan waktu azan
getLocation();
