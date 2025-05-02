console.log("Uygulama başlatılıyor...");

let courses = [];
let competitorCourses = [];
let pastData = getStoredData('pastData') || [];
let schedule = getStoredData('schedule') || [];
let showDetailed = false;
let gradeLog = getStoredData('gradeLog') || [];
let badges = getStoredData('badges') || [];
let aiTips = [];

function getStoredData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function saveStoredData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function initializeApp() {
    console.log("Sayfa yüklendi.");
    const path = window.location.pathname.split('/').pop();
    switch (path) {
        case 'anasayfa.html': renderHome(); break;
        case 'analizyap.html': renderSelectCourses(); break;
        case 'dersprogrami.html': renderScheduleView(); break;
        case 'gecmisanalizler.html': renderPastData(); break;
        case 'hedefbelirle.html': renderGoalSetting(); break;
        case 'ozelsenaryo.html': renderCustomScenario(); break;
        default: window.location.href = 'anasayfa.html';
    }
    updateAiCoach();
}

// Ana Sayfa
function renderHome() {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `
        <div class="text-center py-10">
            <h2 class="text-3xl font-bold mb-4 animate__animated animate__fadeIn">Rakibini Ez, Birinci Ol!</h2>
            <p class="text-lg mb-6">60+ analizle notlarını uçur, rakibini geç, okulun kralı ol!</p>
            <a href="analizyap.html" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300">
                Hemen Analiz Yap
            </a>
            ${badges.length > 0 ? `
                <div class="mt-4">
                    <h3 class="text-xl font-semibold mb-2">Kazandığın Rozetler</h3>
                    <div class="flex flex-wrap gap-2 justify-center">
                        ${badges.map(b => `<span class="badge">${b}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Analiz Yap
function renderSelectCourses() {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">Kaç Ders Analiz Edeceksiniz?</h2>
        <p class="mb-4">Ders sayısını gir, notlarını ve rakibinin notlarını ekle.</p>
        <input id="courseCount" type="number" min="1" max="50" class="p-2 border rounded mb-4 w-full max-w-xs" placeholder="Ders sayısı (ör. 5)" />
        <p id="courseCountError" class="error hidden">1 ile 50 arasında bir sayı girin!</p>
        <button onclick="handleCourseCount()" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Devam Et
        </button>
    `;
}

function handleCourseCount() {
    const count = parseInt(document.getElementById('courseCount').value) || 0;
    const error = document.getElementById('courseCountError');
    if (count > 0 && count <= 50) {
        courses = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            name: `Ders ${i + 1}`,
            hours: '',
            grade: ''
        }));
        competitorCourses = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            name: `Ders ${i + 1}`,
            hours: '',
            grade: ''
        }));
        error.classList.add('hidden');
        renderSchedule(true);
    } else {
        error.classList.remove('hidden');
    }
}

function renderSchedule(isInitial = false) {
    const app = document.getElementById('app');
    if (!app) return;
    let html = `
        <h2 class="text-2xl font-bold mb-4">Ders Programını Oluştur</h2>
        <p class="mb-4">Ders isimlerini ve haftalık çalışma saatlerini gir.</p>
        <div class="grid grid-cols-1 gap-4">
            ${courses.map(course => `
                <div class="p-4 bg-white rounded shadow analysis-box">
                    <input id="name_${course.id}" type="text" placeholder="Ders Adı (ör. Matematik)" class="p-2 border rounded w-full mb-2" value="${course.name}" />
                    <input id="hours_${course.id}" type="number" min="0" placeholder="Haftalık Saat (ör. 5)" class="p-2 border rounded w-full" value="${course.hours}" />
                    <p id="hours_${course.id}_error" class="error hidden">0 veya pozitif bir sayı gir!</p>
                </div>
            `).join('')}
        </div>
        <button onclick="saveSchedule(${isInitial})" class="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            ${isInitial ? 'Veri Girişine Geç' : 'Programı Kaydet'}
        </button>
        <button onclick="${isInitial ? 'renderSelectCourses()' : 'renderScheduleView()'}" class="mt-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Geri Dön
        </button>
    `;
    app.innerHTML = html;
}

function saveSchedule(isInitial) {
    let hasError = false;
    courses = courses.map(course => {
        const name = document.getElementById(`name_${course.id}`).value || `Ders ${course.id}`;
        const hours = document.getElementById(`hours_${course.id}`).value;
        const error = document.getElementById(`hours_${course.id}_error`);
        if (hours && parseFloat(hours) < 0) {
            error.classList.remove('hidden');
            hasError = true;
        } else {
            error.classList.add('hidden');
        }
        return { ...course, name, hours };
    });
    if (hasError) return;
    competitorCourses = competitorCourses.map(course => ({
        ...course,
        name: courses.find(c => c.id === course.id).name
    }));
    schedule = courses.map(course => ({
        name: course.name,
        hours: parseFloat(course.hours) || 0
    }));
    saveStoredData('schedule', schedule);
    if (isInitial) {
        renderInputData(courses.length);
    } else {
        renderScheduleView();
    }
}

function renderInputData(count) {
    const app = document.getElementById('app');
    if (!app) return;
    let html = `
        <h2 class="text-2xl font-bold mb-4">Notlarını Gir</h2>
        <p class="mb-4">Her ders için notlarını (0-100) ve rakibinin notlarını gir.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 class="text-xl font-semibold mb-2">Senin Notların</h3>
                ${courses.map(course => `
                    <div class="mb-4 p-4 bg-white rounded shadow analysis-box">
                        <h4 class="font-medium">${course.name}</h4>
                        <input id="grade_${course.id}" type="number" min="0" max="100" placeholder="Notun (0-100)" class="p-2 border rounded w-full" value="${course.grade}" />
                        <p id="grade_${course.id}_error" class="error hidden">0-100 arasında bir not gir!</p>
                    </div>
                `).join('')}
            </div>
            <div>
                <h3 class="text-xl font-semibold mb-2">Rakibin Notları</h3>
                ${competitorCourses.map(course => `
                    <div class="mb-4 p-4 bg-white rounded shadow analysis-box">
                        <h4 class="font-medium">${course.name}</h4>
                        <input id="comp_grade_${course.id}" type="number" min="0" max="100" placeholder="Rakibin Notu (0-100)" class="p-2 border rounded w-full" value="${course.grade}" />
                        <p id="comp_grade_${course.id}_error" class="error hidden">0-100 arasında bir not gir!</p>
                    </div>
                `).join('')}
            </div>
        </div>
        <button onclick="saveInputData(${count})" class="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Analizi Gör
        </button>
        <button onclick="renderSelectCourses()" class="mt-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Geri Dön
        </button>
    `;
    app.innerHTML = html;
}

function saveInputData(count) {
    let hasError = false;
    const newGrades = [];
    courses = courses.map(course => {
        const grade = document.getElementById(`grade_${course.id}`).value;
        const error = document.getElementById(`grade_${course.id}_error`);
        if (grade && (parseFloat(grade) < 0 || parseFloat(grade) > 100)) {
            error.classList.remove('hidden');
            hasError = true;
        } else {
            error.classList.add('hidden');
            if (grade) newGrades.push({ course: course.name, grade: parseFloat(grade), timestamp: new Date().toISOString() });
        }
        return { ...course, grade };
    });
    competitorCourses = competitorCourses.map(course => {
        const grade = document.getElementById(`comp_grade_${course.id}`).value;
        const error = document.getElementById(`comp_grade_${course.id}_error`);
        if (grade && (parseFloat(grade) < 0 || parseFloat(grade) > 100)) {
            error.classList.remove('hidden');
            hasError = true;
        } else {
            error.classList.add('hidden');
        }
        return { ...course, grade };
    });
    if (hasError) return;
    gradeLog.push(...newGrades);
    saveStoredData('gradeLog', gradeLog);
    pastData.push({
        timestamp: new Date().toISOString(),
        courses,
        competitorCourses,
        week: pastData.length + 1
    });
    saveStoredData('pastData', pastData);
    checkBadges();
    renderAnalysis();
}

function checkBadges() {
    const analysis = calculateAnalysis();
    if (analysis.genelKarsilastirma.myAverage >= 90 && !badges.includes('Not Kralı')) {
        badges.push('Not Kralı');
    }
    if (analysis.genelKarsilastirma.diff > 10 && !badges.includes('Rakip Ezici')) {
        badges.push('Rakip Ezici');
    }
    if (pastData.length >= 5 && !badges.includes('Sadık Analist')) {
        badges.push('Sadık Analist');
    }
    if (analysis.kazanmaOlasiligi && analysis.kazanmaOlasiligi.probability >= 0.8 && !badges.includes('Zafer Avcısı')) {
        badges.push('Zafer Avcısı');
    }
    saveStoredData('badges', badges);
}

function calculateAnalysis() {
    const analysis = {
        genelKarsilastirma: { myAverage: 0, compAverage: 0, diff: 0 },
        agirlikliOrtalama: { myWeighted: 0, compWeighted: 0 },
        dersAnalizi: [],
        birincilikSimulasyonu: { targetAverage: 0, neededCourses: [] },
        oncelikSirasi: [],
        dersDurumu: [],
        hedefFarki: { gap: 0, needed: [] },
        yillikPerformans: [],
        siralamaSimulasyonu: [],
        farkKapatma: [],
        zayifDersTespiti: [],
        stratejiKoclugu: [],
        dersKatkisi: [],
        rakipSimulasyonlari: [],
        savasSkoru: [],
        zamanSerisiAnalizi: [],
        odakHaritasi: [],
        yorgunlukAnalizi: [],
        finalTaktikRaporu: [],
        psikolojikRisk: [],
        surprizFaktoru: [],
        kazanmaSenaryolari: [],
        rakipZayifNokta: [],
        performansTahmini: [],
        gucluYonAnalizi: [],
        stratejikYolHaritasi: [],
        rakipPsikolojikProfil: [],
        rakipDalgalanmaModeli: [], // Yeni analiz
        aiRiskSkoru: [], // Yeni analiz
        kazanmaOlasiligi: { probability: 0, comment: '' }, // Yeni analiz
        otomatikOnceliklendirme: [], // Yeni analiz
        performansAnomalisi: [], // Yeni analiz
        motivasyonEndeksi: [], // Yeni analiz
        rakipStratejiTersine: [], // Yeni analiz
        dersKorelasyonu: [], // Yeni analiz
        zamanOptimizasyonu: [], // Yeni analiz
        gelecekHaftaSenaryo: [] // Yeni analiz
    };

    // Genel Ortalama Karşılaştırması
    const myValidGrades = courses.filter(c => c.grade !== '' && !isNaN(parseFloat(c.grade)));
    const compValidGrades = competitorCourses.filter(c => c.grade !== '' && !isNaN(parseFloat(c.grade)));
    analysis.genelKarsilastirma.myAverage = myValidGrades.length > 0
        ? myValidGrades.reduce((sum, c) => sum + parseFloat(c.grade), 0) / myValidGrades.length
        : 0;
    analysis.genelKarsilastirma.compAverage = compValidGrades.length > 0
        ? compValidGrades.reduce((sum, c) => sum + parseFloat(c.grade), 0) / compValidGrades.length
        : 0;
    analysis.genelKarsilastirma.diff = analysis.genelKarsilastirma.myAverage - analysis.genelKarsilastirma.compAverage;

    // Ağırlıklı Ortalama
    let myWeightedSum = 0, compWeightedSum = 0, totalHours = 0;
    courses.forEach((course, index) => {
        const myGrade = parseFloat(course.grade) || 0;
        const compGrade = parseFloat(competitorCourses[index].grade) || 0;
        const hours = parseFloat(schedule.find(s => s.name === course.name)?.hours) || 1;
        myWeightedSum += myGrade * hours;
        compWeightedSum += compGrade * hours;
        totalHours += hours;
    });
    analysis.agirlikliOrtalama.myWeighted = totalHours > 0 ? myWeightedSum / totalHours : 0;
    analysis.agirlikliOrtalama.compWeighted = totalHours > 0 ? compWeightedSum / totalHours : 0;

    // Kazanma Olasılığı Simülasyonu (Monte Carlo benzeri)
    let winCount = 0;
    const simulations = 1000;
    for (let i = 0; i < simulations; i++) {
        let mySimAvg = 0, compSimAvg = 0;
        courses.forEach((course, index) => {
            const myGrade = parseFloat(course.grade) || 50;
            const compGrade = parseFloat(competitorCourses[index].grade) || 50;
            const myVariance = pastData.map(d => d.courses.find(c => c.name === course.name)?.grade).filter(g => g).map(g => parseFloat(g)).reduce((sum, g, i, arr) => i > 0 ? sum + Math.pow(g - arr[i-1], 2) : sum, 0) / (pastData.length - 1) || 10;
            const compVariance = pastData.map(d => d.competitorCourses.find(c => c.name === course.name)?.grade).filter(g => g).map(g => parseFloat(g)).reduce((sum, g, i, arr) => i > 0 ? sum + Math.pow(g - arr[i-1], 2) : sum, 0) / (pastData.length - 1) || 10;
            const mySimGrade = Math.min(100, Math.max(0, myGrade + (Math.random() * 2 - 1) * Math.sqrt(myVariance)));
            const compSimGrade = Math.min(100, Math.max(0, compGrade + (Math.random() * 2 - 1) * Math.sqrt(compVariance)));
            mySimAvg += mySimGrade;
            compSimAvg += compSimGrade;
        });
        mySimAvg /= courses.length;
        compSimAvg /= courses.length;
        if (mySimAvg > compSimAvg) winCount++;
    }
    analysis.kazanmaOlasiligi.probability = winCount / simulations;
    analysis.kazanmaOlasiligi.comment = analysis.kazanmaOlasiligi.probability >= 0.8
        ? 'Rakibi geçme olasılığın çok yüksek, gazla devam!'
        : analysis.kazanmaOlasiligi.probability >= 0.5
        ? 'Rakiple kafa kafayasın, birkaç dersi sıkı tut!'
        : 'Rakip önde, acil strateji değiştir!';

    // Ders Bazlı Analiz ve Yeni Analizler
    courses.forEach((course, index) => {
        const myGrade = parseFloat(course.grade) || null;
        const compGrade = parseFloat(competitorCourses[index].grade) || null;
        const hours = parseFloat(schedule.find(s => s.name === course.name)?.hours) || 1;
        const pastCourseGrades = pastData.map(data => {
            const pastCourse = data.courses.find(c => c.name === course.name);
            return pastCourse && parseFloat(pastCourse.grade) || null;
        }).filter(g => g !== null);
        const pastCompGrades = pastData.map(data => {
            const pastCourse = data.competitorCourses.find(c => c.name === course.name);
            return pastCourse && parseFloat(pastCourse.grade) || null;
        }).filter(g => g !== null);

        const courseInfo = {
            course: course.name,
            myGrade,
            compGrade,
            hours,
            status: 'Eksik',
            gap: null,
            comment: '',
            priority: 0,
            trend: 0,
            difficulty: 0
        };

        // Ders Zorluğu
        const avgGrade = pastCourseGrades.length > 0
            ? pastCourseGrades.reduce((sum, g) => sum + g, 0) / pastCourseGrades.length
            : myGrade || 50;
        courseInfo.difficulty = avgGrade < 60 ? 'Zor' : avgGrade < 80 ? 'Orta' : 'Kolay';

        if (myGrade !== null && compGrade !== null) {
            courseInfo.gap = myGrade - compGrade;
            courseInfo.status = courseInfo.gap > 0 ? 'Öndesin' : courseInfo.gap < 0 ? 'Geridesin' : 'Eşit';
            courseInfo.priority = Math.abs(courseInfo.gap) * hours;
            courseInfo.comment = myGrade >= 80
                ? `${course.name}'te coşuyorsun, devam et!`
                : myGrade < 60
                ? `${course.name} biraz sıkıntılı, buna aban hacı!`
                : `${course.name}'te iyisin ama daha coşabilirsin!`;
        } else if (myGrade === null) {
            courseInfo.comment = `${course.name} notun eksik, hemen gir!`;
        } else if (compGrade === null) {
            courseInfo.comment = `Rakibin ${course.name} notu eksik, avantaj sende!`;
        }

        // Trend Analizi
        if (pastCourseGrades.length > 0) {
            const lastGrade = pastCourseGrades[pastCourseGrades.length - 1];
            courseInfo.trend = myGrade ? myGrade - lastGrade : 0;
        }

        analysis.dersAnalizi.push(courseInfo);
        analysis.dersDurumu.push(`${course.name}: ${courseInfo.status} (${courseInfo.gap?.toFixed(2) || 'Eksik'} puan fark)`);
        analysis.oncelikSirasi.push({ course: course.name, priority: courseInfo.priority, gap: courseInfo.gap, hours });

        // Ders Değeri x Katkı Katsayısı Matrisi
        const contribution = myGrade ? (myGrade * hours) / totalHours : 0;
        let contributionStatus = contribution > 10 ? 'Yüksek Katkı' : contribution > 5 ? 'Orta Katkı' : 'Düşük Katkı';
        analysis.dersKatkisi.push({
            course: course.name,
            contribution,
            status: contributionStatus,
            comment: `${course.name}: ${contributionStatus} (${contribution.toFixed(2)} puan)`
        });

        // Rakip Sabit / Gelişen Simülasyonları
        const staticCompAvg = compGrade || 50;
        const growingCompAvg = pastCompGrades.length > 0 ? pastCompGrades[pastCompGrades.length - 1] + 5 : staticCompAvg + 5;
        analysis.rakipSimulasyonlari.push({
            course: course.name,
            static: myGrade > staticCompAvg ? 'Rakip sabit kalırsa geçersin!' : `Rakip sabit kalırsa ${Math.abs(myGrade - staticCompAvg).toFixed(2)} puan kapatmalısın.`,
            growing: myGrade > growingCompAvg ? 'Rakip gelişse bile geçersin!' : `Rakip gelişirse ${Math.abs(myGrade - growingCompAvg).toFixed(2)} puan kapatmalısın.`
        });

        // Ders Bazlı Savaş Skoru
        let battleScore = 5;
        if (myGrade && compGrade) {
            battleScore = Math.min(10, Math.max(0, 5 + ((myGrade - compGrade) / 5)));
        }
        analysis.savasSkoru.push({
            course: course.name,
            score: battleScore,
            comment: battleScore >= 8 ? `${course.name}'te rakibi ezmişsin!` : battleScore <= 2 ? `${course.name}'te patlamışsın, acil çalış!` : `${course.name}'te başa başsın, biraz gazla!`
        });

        // Zaman Serisi Analizi
        if (pastCourseGrades.length > 1) {
            const trend = courseInfo.trend;
            const avgTrend = pastCourseGrades.reduce((sum, g, i) => i > 0 ? sum + (g - pastCourseGrades[i - 1]) : sum, 0) / (pastCourseGrades.length - 1);
            analysis.zamanSerisiAnalizi.push({
                course: course.name,
                trend,
                comment: trend > 0 ? `${course.name}'te son hafta ${trend.toFixed(2)} puan yükseldin!` : trend < 0 ? `${course.name}'te ${Math.abs(trend).toFixed(2)} puan düştün, dikkat!` : `${course.name}'te stabil gidiyorsun.`,
                aiAdvice: avgTrend < -2 ? `${course.name}'te düşüş devam ederse 2 hafta sonra rakip geçer, ${Math.ceil(hours * 0.3)} saat ekle!` : `${course.name}'te tempo iyi, koru!`
            });
        }

        // Odak Haritası
        const efficiency = myGrade && hours ? myGrade / hours : 0;
        let focusStatus = efficiency > 20 ? 'Gizli Yetenek' : efficiency < 10 ? 'Verimsiz' : 'Normal';
        analysis.odakHaritasi.push({
            course: course.name,
            efficiency,
            status: focusStatus,
            comment: focusStatus === 'Gizli Yetenek' ? `${course.name}'te az çalışıp çok alıyorsun, buraya aban!` : focusStatus === 'Verimsiz' ? `${course.name}'te çok çalışıp az alıyorsun, strateji değiştir!` : `${course.name}'te dengelisin, devam et.`
        });

        // Ders Yorgunluk Analizi
        const fatigueScore = hours > 4 && myGrade < 70 ? (100 - myGrade) * hours : 0;
        analysis.yorgunlukAnalizi.push({
            course: course.name,
            fatigue: fatigueScore,
            comment: fatigueScore > 50 ? `${course.name}'te yoruluyorsun, ${Math.ceil(hours * 0.5)} saat azalt, başka derse kaydır!` : `${course.name}'te yorgunluk yok, devam!`
        });

        // Final Taktik Raporu
        analysis.finalTaktikRaporu.push({
            course: course.name,
            priority: courseInfo.priority,
            comment: courseInfo.gap < 0 ? `${course.name}'te ${Math.abs(courseInfo.gap).toFixed(2)} puan geridesin, son hafta ${Math.ceil(hours * 0.3)} saat çalış!` : `${course.name}'i koru, rakip burada zayıf!`
        });

        // Psikolojik Risk Modeli
        const gradeVolatility = pastCourseGrades.length > 1 ? Math.sqrt(pastCourseGrades.reduce((sum, g, i) => i > 0 ? sum + Math.pow(g - pastCourseGrades[i - 1], 2) : sum, 0) / (pastCourseGrades.length - 1)) : 0;
        analysis.psikolojikRisk.push({
            course: course.name,
            volatility: gradeVolatility,
            comment: gradeVolatility > 20 ? `${course.name}'te bıkmış gibisin, motive ol, 2 gün ${Math.ceil(hours * 0.2)} saat çalış!` : `${course.name}'te istikrarlısın, bravo!`
        });

        // Sürpriz Faktörü Analizi
        const compSurprise = pastCompGrades.length > 1 && pastCompGrades[pastCompGrades.length - 1] - pastCompGrades[pastCompGrades.length - 2] > 10;
        analysis.surprizFaktoru.push({
            course: course.name,
            surprise: compSurprise,
            comment: compSurprise ? `${course.name}'te rakip sıçrama yapabilir, erkenden ${Math.ceil(hours * 0.3)} saat çalış!` : `${course.name}'te rakip stabil, avantaj sende!`
        });

        // Kazanma Senaryosu Özetleri
        const minEffortGrade = compGrade ? compGrade + 1 : 85;
        const midEffortGrade = compGrade ? compGrade + 5 : 90;
        const maxEffortGrade = 95;
        analysis.kazanmaSenaryolari.push({
            course: course.name,
            minEffort: `${course.name}: ${minEffortGrade.toFixed(2)} al, ${Math.ceil(hours * 0.2)} saat çalış.`,
            midEffort: `${course.name}: ${midEffortGrade.toFixed(2)} al, ${Math.ceil(hours * 0.3)} saat çalış.`,
            maxEffort: `${course.name}: ${maxEffortGrade.toFixed(2)} al, ${Math.ceil(hours * 0.5)} saat çalış.`
        });

        // Rakip Zayıf Nokta Analizi
        if (compGrade !== null && compGrade < 60) {
            analysis.rakipZayifNokta.push({
                course: course.name,
                compGrade,
                comment: `${course.name}'te rakip ${compGrade.toFixed(2)} ile zayıf, buraya ${Math.ceil(hours * 0.4)} saat çalışarak farkı aç!`
            });
        }

        // İleri Görüşlü Performans Tahmini
        const myTrend = pastCourseGrades.length > 1 ? (myGrade - pastCourseGrades[pastCourseGrades.length - 1]) : 0;
        const compTrend = pastCompGrades.length > 1 ? (compGrade - pastCompGrades[pastCompGrades.length - 1]) : 0;
        const myFutureGrade = myGrade ? Math.min(100, Math.max(0, myGrade + myTrend)) : 50;
        const compFutureGrade = compGrade ? Math.min(100, Math.max(0, compGrade + compTrend)) : 50;
        analysis.performansTahmini.push({
            course: course.name,
            myFutureGrade,
            compFutureGrade,
            comment: myFutureGrade > compFutureGrade
                ? `${course.name}'te gelecek hafta ${myFutureGrade.toFixed(2)} ile önde olacaksın, devam et!`
                : `${course.name}'te rakip ${compFutureGrade.toFixed(2)} ile öne geçebilir, ${Math.ceil(hours * 0.3)} saat çalış!`
        });

        // Kullanıcı Güçlü Yön Analizi
        if (myGrade !== null && myGrade >= 85) {
            analysis.gucluYonAnalizi.push({
                course: course.name,
                myGrade,
                comment: `${course.name}'te ${myGrade.toFixed(2)} ile güçlüsün, bu dersi ${Math.ceil(hours * 0.2)} saat çalışarak koru!`
            });
        }

        // Stratejik Yol Haritası
        const targetAverage = getStoredData('targetAverage') || 85;
        const gapToTarget = myGrade ? targetAverage - myGrade : targetAverage - 50;
        analysis.stratejikYolHaritasi.push({
            course: course.name,
            gap: gapToTarget,
            comment: gapToTarget > 0
                ? `${course.name}'te hedefe ulaşmak için ${gapToTarget.toFixed(2)} puan artır, haftada ${Math.ceil(hours * 0.5)} saat çalış!`
                : `${course.name}'te hedefi geçmişsin, ${Math.ceil(hours * 0.2)} saat ile koru!`
        });

        // Rakip Psikolojik Profil
        const compVolatility = pastCompGrades.length > 1 ? Math.sqrt(pastCompGrades.reduce((sum, g, i) => i > 0 ? sum + Math.pow(g - pastCompGrades[i - 1], 2) : sum, 0) / (pastCompGrades.length - 1)) : 0;
        analysis.rakipPsikolojikProfil.push({
            course: course.name,
            volatility: compVolatility,
            comment: compVolatility > 20
                ? `${course.name}'te rakip istikrarsız, baskıyı artır, ${Math.ceil(hours * 0.3)} saat çalış!`
                : `${course.name}'te rakip istikrarlı, dikkatli ol, ${Math.ceil(hours * 0.2)} saat çalış!`
        });

        // Yeni Analiz 1: Rakip Performans Dalgalanma Modeli
        const compGradeVariance = pastCompGrades.length > 1 ? pastCompGrades.reduce((sum, g, i) => i > 0 ? sum + Math.pow(g - pastCompGrades[i - 1], 2) : sum, 0) / (pastCompGrades.length - 1) : 0;
        analysis.rakipDalgalanmaModeli.push({
            course: course.name,
            variance: compGradeVariance,
            comment: compGradeVariance > 100
                ? `${course.name}'te rakip dalgalı, bu dersi ${Math.ceil(hours * 0.4)} saat çalışarak sabitle!`
                : `${course.name}'te rakip tutarlı, fark yaratmak için ${Math.ceil(hours * 0.3)} saat çalış!`
        });

        // Yeni Analiz 2: AI Tabanlı Risk Skoru
        const riskScore = myGrade && compGrade
            ? Math.max(0, Math.min(100, 100 - (myGrade - compGrade + 100) * (hours / totalHours)))
            : 50;
        analysis.aiRiskSkoru.push({
            course: course.name,
            riskScore,
            comment: riskScore > 70
                ? `${course.name}'te risk yüksek, ${Math.ceil(hours * 0.5)} saat çalışarak riski azalt!`
                : riskScore < 30
                ? `${course.name}'te risksizsin, ${Math.ceil(hours * 0.2)} saat ile koru!`
                : `${course.name}'te orta risk, ${Math.ceil(hours * 0.3)} saat çalış!`
        });

        // Yeni Analiz 3: Otomatik Ders Önceliklendirme
        const priorityScore = (compGrade && compGrade < 60 ? 0.4 : 0) + (myGrade && myGrade < 60 ? 0.3 : 0) + (hours / totalHours) * 0.3;
        analysis.otomatikOnceliklendirme.push({
            course: course.name,
            priorityScore,
            comment: priorityScore > 0.6
                ? `${course.name} en kritik ders, ${Math.ceil(hours * 0.5)} saat çalış!`
                : priorityScore > 0.3
                ? `${course.name} orta öncelik, ${Math.ceil(hours * 0.3)} saat çalış!`
                : `${course.name} düşük öncelik, ${Math.ceil(hours * 0.2)} saat yeter.`
        });

        // Yeni Analiz 4: Performans Anomalisi Tespiti
        const myAnomaly = pastCourseGrades.length > 2 && myGrade && Math.abs(myGrade - pastCourseGrades[pastCourseGrades.length - 1]) > 20;
        const compAnomaly = pastCompGrades.length > 2 && compGrade && Math.abs(compGrade - pastCompGrades[pastCompGrades.length - 1]) > 20;
        analysis.performansAnomalisi.push({
            course: course.name,
            myAnomaly,
            compAnomaly,
            comment: myAnomaly
                ? `${course.name}'te notun ani değişti, sebebi araştır, ${Math.ceil(hours * 0.3)} saat çalış!`
                : compAnomaly
                ? `${course.name}'te rakip ani değişim yaptı, dikkat et, ${Math.ceil(hours * 0.3)} saat çalış!`
                : `${course.name}'te her şey normal, devam!`
        });

        // Yeni Analiz 5: Stratejik Motivasyon Endeksi
        const motivationScore = myGrade && pastCourseGrades.length > 0
            ? Math.min(100, Math.max(0, myGrade + (myTrend || 0) * 5 - hours * 2))
            : 50;
        analysis.motivasyonEndeksi.push({
            course: course.name,
            motivationScore,
            comment: motivationScore > 80
                ? `${course.name}'te motivasyonun tavan, bu dersi ${Math.ceil(hours * 0.2)} saat çalışarak koru!`
                : motivationScore < 40
                ? `${course.name}'te motivasyon düşük, kendine hedef koy, ${Math.ceil(hours * 0.4)} saat çalış!`
                : `${course.name}'te motivasyon dengeli, ${Math.ceil(hours * 0.3)} saat çalış!`
        });

        // Yeni Analiz 6: Rakip Strateji Tersine Mühendisliği
        const compEffort = compGrade && hours ? compGrade / hours : 0;
        analysis.rakipStratejiTersine.push({
            course: course.name,
            compEffort,
            comment: compEffort > 20
                ? `${course.name}'te rakip az çalışıp çok alıyor, sen de ${Math.ceil(hours * 0.3)} saat çalış!`
                : compEffort < 10
                ? `${course.name}'te rakip verimsiz, avantajı kullan, ${Math.ceil(hours * 0.4)} saat çalış!`
                : `${course.name}'te rakip dengeli, ${Math.ceil(hours * 0.3)} saat çalış!`
        });

        // Yeni Analiz 7: Dersler Arası Korelasyon Analizi
        const relatedCourses = courses.map((otherCourse, otherIndex) => {
            if (otherCourse.name === course.name) return null;
            const otherPastGrades = pastData.map(d => d.courses.find(c => c.name === otherCourse.name)?.grade).filter(g => g).map(g => parseFloat(g));
            if (pastCourseGrades.length > 1 && otherPastGrades.length > 1) {
                const cov = pastCourseGrades.reduce((sum, g, i) => sum + (g - avgGrade) * (otherPastGrades[i] - (otherPastGrades.reduce((s, g) => s + g, 0) / otherPastGrades.length)), 0) / pastCourseGrades.length;
                const stdDev1 = Math.sqrt(pastCourseGrades.reduce((sum, g) => sum + Math.pow(g - avgGrade, 2), 0) / pastCourseGrades.length);
                const stdDev2 = Math.sqrt(otherPastGrades.reduce((sum, g) => sum + Math.pow(g - (otherPastGrades.reduce((s, g) => s + g, 0) / otherPastGrades.length), 2), 0) / otherPastGrades.length);
                const correlation = cov / (stdDev1 * stdDev2);
                return correlation > 0.5 ? otherCourse.name : null;
            }
            return null;
        }).filter(c => c);
        analysis.dersKorelasyonu.push({
            course: course.name,
            relatedCourses,
            comment: relatedCourses.length > 0
                ? `${course.name} ile ${relatedCourses.join(', ')} bağlantılı, bunlara beraber çalış!`
                : `${course.name} bağımsız, tek başına çalış!`
        });

        // Yeni Analiz 8: Zaman Optimizasyon Modeli
        const optimalHours = myGrade && compGrade && myGrade < compGrade
            ? hours * (1 + (compGrade - myGrade) / 100)
            : hours * 0.8;
        analysis.zamanOptimizasyonu.push({
            course: course.name,
            optimalHours,
            comment: optimalHours > hours
                ? `${course.name}'te ${optimalHours.toFixed(1)} saat çalış, ${Math.ceil(optimalHours - hours)} saat ekle!`
                : `${course.name}'te ${optimalHours.toFixed(1)} saat yeter, ${Math.ceil(hours - optimalHours)} saat başka derse kaydır!`
        });

        // Yeni Analiz 9: Gelecek Hafta Senaryo Modeli
        const myNextWeekGrade = myGrade ? Math.min(100, Math.max(0, myGrade + (myTrend || 0) * 1.5)) : 50;
        const compNextWeekGrade = compGrade ? Math.min(100, Math.max(0, compGrade + (compTrend || 0) * 1.5)) : 50;
        analysis.gelecekHaftaSenaryo.push({
            course: course.name,
            myNextWeekGrade,
            compNextWeekGrade,
            comment: myNextWeekGrade > compNextWeekGrade
                ? `${course.name}'te önümüzdeki hafta ${myNextWeekGrade.toFixed(2)} ile önde olacaksın!`
                : `${course.name}'te rakip ${compNextWeekGrade.toFixed(2)} ile öne geçebilir, ${Math.ceil(hours * 0.4)} saat çalış!`
        });
    });

    // Mevcut Analizler (Devam)
    const targetForFirst = analysis.genelKarsilastirma.compAverage + 5;
    analysis.birincilikSimulasyonu.targetAverage = targetForFirst;
    analysis.birincilikSimulasyonu.neededCourses = courses.map(course => {
        const myGrade = parseFloat(course.grade) || 75;
        const hours = parseFloat(schedule.find(s => s.name === course.name)?.hours) || 1;
        const neededGrade = Math.min(myGrade + (targetForFirst - analysis.genelKarsilastirma.myAverage) * courses.length / hours, 100);
        return `${course.name}: ${neededGrade.toFixed(2)} al, ${Math.ceil(hours * 0.2)} saat çalış.`;
    });
    analysis.oncelikSirasi.sort((a, b) => b.priority - a.priority);
    analysis.oncelikSirasi = analysis.oncelikSirasi.map(p => 
        `${p.course}: ${p.gap < 0 ? '+' + Math.abs(p.gap).toFixed(2) : p.gap.toFixed(2)} puan getirir, ${p.hours} saat çalış.`
    );
    const targetAverage = getStoredData('targetAverage') || 85;
    analysis.hedefFarki.gap = targetAverage - analysis.genelKarsilastirma.myAverage;
    analysis.hedefFarki.needed = courses.map(course => {
        const myGrade = parseFloat(course.grade) || 75;
        const hours = parseFloat(schedule.find(s => s.name === course.name)?.hours) || 1;
        const neededGrade = Math.min(myGrade + analysis.hedefFarki.gap * courses.length / hours, 100);
        return `${course.name}: ${neededGrade.toFixed(2)} al, ${Math.ceil(hours * 0.2)} saat çalış.`;
    });
    const yearlyAverages = pastData.map(data => {
        const avg = data.courses.filter(c => c.grade !== '' && !isNaN(parseFloat(c.grade)))
            .reduce((sum, c) => sum + parseFloat(c.grade), 0) / data.courses.length;
        return { week: data.week, avg };
    });
    analysis.yillikPerformans = yearlyAverages.map(y => `Hafta ${y.week}: Ortalama ${y.avg.toFixed(2)}`);
    analysis.siralamaSimulasyonu.push(
        analysis.genelKarsilastirma.myAverage > analysis.genelKarsilastirma.compAverage
            ? 'Şu an birincisin!' : 'Rakip önde, farkı kapat!'
    );
    analysis.farkKapatma = courses.map((course, index) => {
        const gap = parseFloat(course.grade) - parseFloat(competitorCourses[index].grade) || 0;
        return gap < 0 ? `${course.name}: ${Math.abs(gap).toFixed(2)} puan kapat, ${Math.ceil((schedule.find(s => s.name === course.name)?.hours || 1) * 0.2)} saat çalış.` : '';
    }).filter(g => g);
    analysis.zayifDersTespiti = courses
        .filter(c => parseFloat(c.grade) < 60)
        .map(c => `${c.name}: Notun ${c.grade}, buna aban!`);
    analysis.stratejiKoclugu = courses.map(course => {
        const myGrade = parseFloat(course.grade) || 75;
        const hours = parseFloat(schedule.find(s => s.name === course.name)?.hours) || 1;
        return myGrade < 60
            ? `${course.name}: Bu tempoyla rakip geçer, ${Math.ceil(hours * 0.2)} saat ekle!`
            : myGrade >= 80
            ? `${course.name}: Süper gidiyorsun, bu dersi koru!`
            : `${course.name}: Biraz daha çalış, fark yarat!`;
    });

    // Final Taktik Raporu (Toplu)
    analysis.finalTaktikRaporu.sort((a, b) => b.priority - a.priority);
    analysis.finalTaktikRaporu = analysis.finalTaktikRaporu.slice(0, 3).map(t => t.comment);

    return analysis;
}

function renderAnalysis() {
    const app = document.getElementById('app');
    if (!app) return;
    const analysis = calculateAnalysis();
    let html = `
        <h2 class="text-2xl font-bold mb-4">Analiz Sonuçların 🚀</h2>
        <p class="mb-4">İşte yapay zeka destekli 60+ analizle performansın, rakibi ezmeye hazır mısın?</p>
        <div class="flex justify-center mb-4">
            <button onclick="showDetailed = false; renderAnalysis()" class="px-4 py-2 ${!showDetailed ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded-l-lg">
                Özet Analiz
            </button>
            <button onclick="showDetailed = true; renderAnalysis()" class="px-4 py-2 ${showDetailed ? 'bg-blue-600 text-white' : 'bg-gray-200'} rounded-r-lg">
                Detaylı Analiz
            </button>
        </div>
    `;

    if (!showDetailed) {
        html += `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="p-6 rounded shadow analysis-box ${analysis.genelKarsilastirma.diff > 0 ? 'green-box' : analysis.genelKarsilastirma.diff < 0 ? 'red-box' : 'yellow-box'}">
                    <h3 class="text-xl font-semibold mb-2">🧠 Genel Karşılaştırma</h3>
                    <p>Senin Ortalaman: <strong>${analysis.genelKarsilastirma.myAverage.toFixed(2)}</strong></p>
                    <p>Rakibin Ortalaması: <strong>${analysis.genelKarsilastirma.compAverage.toFixed(2)}</strong></p>
                    <p>Fark: <strong>${analysis.genelKarsilastirma.diff.toFixed(2)}</strong> puan ${analysis.genelKarsilastirma.diff > 0 ? '<span class="text-green-600">Öndesin!</span>' : analysis.genelKarsilastirma.diff < 0 ? '<span class="text-red-600">Geridesin!</span>' : 'Eşit!'}</p>
                </div>
                <div class="p-6 rounded shadow analysis-box yellow-box">
                    <h3 class="text-xl font-semibold mb-2">🎯 Kazanma Olasılığı</h3>
                    <p>Olasılık: <strong>%${(analysis.kazanmaOlasiligi.probability * 100).toFixed(1)}</strong></p>
                    <p>${analysis.kazanmaOlasiligi.comment}</p>
                </div>
                <div class="p-6 rounded shadow analysis-box ${analysis.aiRiskSkoru.some(r => r.riskScore > 70) ? 'red-box alarm' : 'yellow-box'}">
                    <h3 class="text-xl font-semibold mb-2">⚠️ AI Risk Skoru</h3>
                    ${analysis.aiRiskSkoru.map(r => `<p>${r.comment}</p>`).join('')}
                </div>
                <div class="p-6 rounded shadow analysis-box green-box">
                    <h3 class="text-xl font-semibold mb-2">📈 Otomatik Önceliklendirme</h3>
                    ${analysis.otomatikOnceliklendirme.map(o => `<p>${o.comment}</p>`).join('')}
                </div>
                <div class="p-6 rounded shadow analysis-box yellow-box">
                    <h3 class="text-xl font-semibold mb-2">🕵️ Rakip Zayıf Nokta</h3>
                    ${analysis.rakipZayifNokta.length > 0
                        ? `<ul class="list-disc pl-5">${analysis.rakipZayifNokta.map(r => `<li>${r.comment}</li>`).join('')}</ul>`
                        : '<p>Rakibin zayıf noktası tespit edilemedi!</p>'}
                </div>
                <div class="p-6 rounded shadow analysis-box green-box">
                    <h3 class="text-xl font-semibold mb-2">🛤️ Stratejik Yol Haritası</h3>
                    ${analysis.stratejikYolHaritasi.map(s => `<p>${s.comment}</p>`).join('')}
                </div>
                <div class="p-6 rounded shadow analysis-box yellow-box">
                    <h3 class="text-xl font-semibold mb-2">🔥 Motivasyon Endeksi</h3>
                    ${analysis.motivasyonEndeksi.map(m => `<p>${m.comment}</p>`).join('')}
                </div>
                <div class="p-6 rounded shadow analysis-box yellow-box">
                    <h3 class="text-xl font-semibold mb-2">📅 Gelecek Hafta Senaryosu</h3>
                    ${analysis.gelecekHaftaSenaryo.map(g => `<p>${g.comment}</p>`).join('')}
                </div>
            </div>
        `;
    } else {
        const turkceBasliklar = {
            genelKarsilastirma: 'Genel Karşılaştırma',
            agirlikliOrtalama: 'Ağırlıklı Ortalama',
            dersAnalizi: 'Ders Analizi',
            birincilikSimulasyonu: 'Birincilik Simülasyonu',
            oncelikSirasi: 'Öncelik Sırası',
            dersDurumu: 'Ders Durumu',
            hedefFarki: 'Hedef Farkı',
            yillikPerformans: 'Yıllık Performans',
            siralamaSimulasyonu: 'Sıralama Simülasyonu',
            farkKapatma: 'Fark Kapatma',
            zayifDersTespiti: 'Zayıf Ders Tespiti',
            stratejiKoclugu: 'Strateji Koçluğu',
            dersKatkisi: 'Ders Katkısı',
            rakipSimulasyonlari: 'Rakip Simülasyonları',
            savasSkoru: 'Savaş Skoru',
            zamanSerisiAnalizi: 'Zaman Serisi Analizi',
            odakHaritasi: 'Odak Haritası',
            yorgunlukAnalizi: 'Yorgunluk Analizi',
            finalTaktikRaporu: 'Final Taktik Raporu',
            psikolojikRisk: 'Psikolojik Risk',
            surprizFaktoru: 'Sürpriz Faktörü',
            kazanmaSenaryolari: 'Kazanma Senaryoları',
            rakipZayifNokta: 'Rakip Zayıf Nokta Analizi',
            performansTahmini: 'İleri Görüşlü Performans Tahmini',
            gucluYonAnalizi: 'Güçlü Yön Analizi',
            stratejikYolHaritasi: 'Stratejik Yol Haritası',
            rakipPsikolojikProfil: 'Rakip Psikolojik Profil',
            rakipDalgalanmaModeli: 'Rakip Performans Dalgalanma Modeli',
            aiRiskSkoru: 'AI Tabanlı Risk Skoru',
            kazanmaOlasiligi: 'Kazanma Olasılığı Simülasyonu',
            otomatikOnceliklendirme: 'Otomatik Ders Önceliklendirme',
            performansAnomalisi: 'Performans Anomalisi Tespiti',
            motivasyonEndeksi: 'Stratejik Motivasyon Endeksi',
            rakipStratejiTersine: 'Rakip Strateji Tersine Mühendisliği',
            dersKorelasyonu: 'Dersler Arası Korelasyon Analizi',
            zamanOptimizasyonu: 'Zaman Optimizasyon Modeli',
            gelecekHaftaSenaryo: 'Gelecek Hafta Senaryo Modeli'
        };
        html += `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${Object.entries(analysis).map(([key, value]) => {
                    return `
                        <div class="p-6 rounded shadow analysis-box ${value.length > 0 || typeof value === 'object' ? 'yellow-box' : 'red-box'} ${key === 'aiRiskSkoru' && value.some(r => r.riskScore > 70) ? 'alarm' : ''}">
                            <h3 class="text-xl font-semibold mb-2">${turkceBasliklar[key]}</h3>
                            ${Array.isArray(value) && value.length > 0
                                ? `<ul class="list-disc pl-5">${value.map(v => `<li>${typeof v === 'object' ? v.comment || JSON.stringify(v) : v}</li>`).join('')}</ul>`
                                : typeof value === 'object'
                                ? `<p>${Object.entries(value).map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${v.toFixed ? v.toFixed(2) : v}`).join('<br>')}</p>`
                                : '<p>Veri eksik!</p>'}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    html += `
        <button onclick="renderInputData(${courses.length})" class="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Geri Dön
        </button>
    `;
    app.innerHTML = html;

    // Grafikler
    setTimeout(() => {
        // Not Karşılaştırma
        const gradeCtx = document.getElementById('gradeChart').getContext('2d');
        document.getElementById('gradeChart').classList.remove('hidden');
        new Chart(gradeCtx, {
            type: 'bar',
            data: {
                labels: courses.map(c => c.name),
                datasets: [
                    { label: 'Senin Notların', data: courses.map(c => parseFloat(c.grade) || 0), backgroundColor: 'rgba(54, 162, 235, 0.5)' },
                    { label: 'Rakibin Notları', data: competitorCourses.map(c => parseFloat(c.grade) || 0), backgroundColor: 'rgba(255, 99, 132, 0.5)' }
                ]
            },
            options: {
                scales: { y: { beginAtZero: true, max: 100 }, x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } } },
                plugins: { legend: { display: true }, title: { display: true, text: 'Not Karşılaştırması' } }
            }
        });

        // Radar Grafik (Sen vs Rakip)
        const radarCtx = document.getElementById('priorityChart').getContext('2d');
        document.getElementById('priorityChart').classList.remove('hidden');
        new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: courses.map(c => c.name),
                datasets: [
                    { label: 'Senin Performans', data: courses.map(c => parseFloat(c.grade) || 50), backgroundColor: 'rgba(54, 162, 235, 0.2)', borderColor: '#36A2EB' },
                    { label: 'Rakibin Performans', data: competitorCourses.map(c => parseFloat(c.grade) || 50), backgroundColor: 'rgba(255, 99, 132, 0.2)', borderColor: '#FF6384' }
                ]
            },
            options: {
                scales: { r: { beginAtZero: true, max: 100 } },
                plugins: { title: { display: true, text: 'Sen vs Rakip Performans' } }
            }
        });

        // Isı Haritası (Zayıf Dersler)
        const heatmapCtx = document.getElementById('correlationChart').getContext('2d');
        document.getElementById('correlationChart').classList.remove('hidden');
        new Chart(heatmapCtx, {
            type: 'bar',
            data: {
                labels: analysis.zayifDersTespiti.map(d => d.split(':')[0]),
                datasets: [{
                    label: 'Zayıf Ders Skoru',
                    data: courses.filter(c => parseFloat(c.grade) < 60).map(c => 100 - parseFloat(c.grade)),
                    backgroundColor: 'rgba(220, 53, 69, 0.5)'
                }]
            },
            options: {
                scales: { y: { beginAtZero: true, max: 100 } },
                plugins: { title: { display: true, text: 'Zayıf Dersler Isı Haritası' } }
            }
        });

        // Zaman Çizelgesi
        const timeSeriesCtx = document.getElementById('progressChart').getContext('2d');
        document.getElementById('progressChart').classList.remove('hidden');
        new Chart(timeSeriesCtx, {
            type: 'line',
            data: {
                labels: pastData.map(d => `Hafta ${d.week}`),
                datasets: [
                    { label: 'Senin Ortalama', data: pastData.map(d => d.courses.reduce((sum, c) => sum + (parseFloat(c.grade) || 0), 0) / d.courses.length), borderColor: '#36A2EB' },
                    { label: 'Rakibin Ortalama', data: pastData.map(d => d.competitorCourses.reduce((sum, c) => sum + (parseFloat(c.grade) || 0), 0) / d.competitorCourses.length), borderColor: '#FF6384' }
                ]
            },
            options: {
                scales: { y: { beginAtZero: true, max: 100 } },
                plugins: { title: { display: true, text: 'Zaman Çizelgesi' } }
            }
        });
    }, 100);
}

function updateAiCoach() {
    const analysis = calculateAnalysis();
    aiTips = [];
    courses.forEach((course, index) => {
        const myGrade = parseFloat(course.grade) || 50;
        const compGrade = parseFloat(competitorCourses[index].grade) || 50;
        const hours = parseFloat(schedule.find(s => s.name === course.name)?.hours) || 1;
        if (myGrade < compGrade) {
            aiTips.push(`${course.name}'te ${Math.abs(myGrade - compGrade).toFixed(2)} puan geridesin, ${Math.ceil(hours * 0.2)} saat çalış!`);
        } else if (myGrade >= 80) {
            aiTips.push(`${course.name}'te kral sensin, koru!`);
        }
        if (analysis.aiRiskSkoru.find(r => r.course === course.name)?.riskScore > 70) {
            aiTips.push(`${course.name}'te risk yüksek, ${Math.ceil(hours * 0.4)} saat çalış!`);
        }
        if (analysis.motivasyonEndeksi.find(m => m.course === course.name)?.motivationScore < 40) {
            aiTips.push(`${course.name}'te motivasyon düşük, hedef koy ve ${Math.ceil(hours * 0.3)} saat çalış!`);
        }
    });
    const aiCoach = document.createElement('div');
    aiCoach.style.position = 'fixed';
    aiCoach.style.bottom = '20px';
    aiCoach.style.right = '20px';
    aiCoach.style.backgroundColor = '#fff';
    aiCoach.style.padding = '10px';
    aiCoach.style.borderRadius = '8px';
    aiCoach.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
    aiCoach.innerHTML = `
        <h4 class="text-sm font-bold">AI Koç</h4>
        <p class="text-xs">${aiTips.length > 0 ? aiTips[Math.floor(Math.random() * aiTips.length)] : 'Hadi, notlarını gir, rakibi ez!'}</p>
    `;
    document.body.appendChild(aiCoach);
    setTimeout(updateAiCoach, 10000); // Her 10 saniyede güncelle
}

function renderScheduleView() {
    const app = document.getElementById('app');
    if (!app) return;
    let html = `
        <h2 class="text-2xl font-bold mb-4">Haftalık Ders Programın</h2>
        <p class="mb-4">İşte ders programın. Düzenlemek için aşağıdan devam et.</p>
        <table class="w-full border-collapse bg-white rounded shadow">
            <tr class="bg-gray-100">
                <th class="p-2 border">Ders</th>
                <th class="p-2 border">Haftalık Saat</th>
            </tr>
            ${schedule.length > 0
                ? schedule.map(s => `
                    <tr>
                        <td class="p-2 border">${s.name}</td>
                        <td class="p-2 border">${s.hours.toFixed(1)}</td>
                    </tr>
                `).join('')
                : '<tr><td colspan="2" class="p-2 text-center">Henüz program oluşturulmadı!</td></tr>'}
        </table>
        <button onclick="renderSchedule()" class="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Programı Düzenle
        </button>
        <a href="anasayfa.html" class="mt-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 inline-block">
            Ana Sayfaya Dön
        </a>
    `;
    app.innerHTML = html;
}

function renderPastData() {
    const app = document.getElementById('app');
    if (!app) return;
    let html = `
        <h2 class="text-2xl font-bold mb-4">Geçmiş Analizlerin</h2>
        <p class="mb-4">Haftalık performansını burada gör.</p>
        <div class="grid grid-cols-1 gap-4">
            ${pastData.length === 0 ? '<p>Henüz analiz yapmadın!</p>' : pastData.map((data, index) => {
                const myAvg = data.courses.filter(c => c.grade !== '' && !isNaN(parseFloat(c.grade)))
                    .reduce((sum, c) => sum + parseFloat(c.grade), 0) / data.courses.length;
                const compAvg = data.competitorCourses.filter(c => c.grade !== '' && !isNaN(parseFloat(c.grade)))
                    .reduce((sum, c) => sum + parseFloat(c.grade), 0) / data.competitorCourses.length;
                return `
                    <div class="p-4 bg-white rounded shadow analysis-box">
                        <p><strong>Hafta ${data.week}</strong> (${new Date(data.timestamp).toLocaleDateString()})</p>
                        <p>Senin Ortalaman: ${myAvg.toFixed(2)}</p>
                        <p>Rakibin Ortalaması: ${compAvg.toFixed(2)}</p>
                        <p>${myAvg > compAvg ? 'Öndesin!' : myAvg < compAvg ? 'Geridesin!' : 'Eşit!'}</p>
                    </div>
                `;
            }).join('')}
        </div>
        <a href="anasayfa.html" class="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block">
            Ana Sayfaya Dön
        </a>
    `;
    app.innerHTML = html;
}

function renderGoalSetting() {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">Hedef Ortalamanı Belirle</h2>
        <p class="mb-4">Hangi ortalamayı hedefliyorsun? Plan yapalım!</p>
        <input id="targetAverage" type="number" min="0" max="100" placeholder="Hedef Ortalama (0-100)" class="p-2 border rounded w-full max-w-xs mb-4" />
        <p id="targetAverageError" class="error hidden">0-100 arasında bir sayı gir!</p>
        <button onclick="calculateGoalPlan()" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Plan Oluştur
        </button>
        <a href="anasayfa.html" class="mt-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 inline-block">
            Ana Sayfaya Dön
        </a>
    `;
}

function calculateGoalPlan() {
    const target = parseFloat(document.getElementById('targetAverage').value) || 0;
    const error = document.getElementById('targetAverageError');
    if (target < 0 || target > 100) {
        error.classList.remove('hidden');
        return;
    }
    error.classList.add('hidden');
    saveStoredData('targetAverage', target);
    const analysis = calculateAnalysis();
    const gap = target - analysis.genelKarsilastirma.myAverage;
    const app = document.getElementById('app');
    app.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">Hedef Planın</h2>
        <div class="p-6 bg-white rounded shadow analysis-box">
            <p>Mevcut Ortalaman: <strong>${analysis.genelKarsilastirma.myAverage.toFixed(2)}</strong></p>
            <p>Hedef Ortalaman: <strong>${target.toFixed(2)}</strong></p>
            <p>Gerekli Artış: <strong>${gap.toFixed(2)}</strong> puan</p>
            <p>Ne yapmalısın?</p>
            <ul class="list-disc pl-5">
                ${gap > 0
                    ? analysis.hedefFarki.needed.map(n => `<li>${n}</li>`).join('')
                    : '<li>Tebrikler, hedefine ulaştın! 🥳</li>'}
            </ul>
        </div>
        <button onclick="renderGoalSetting()" class="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Yeni Hedef
        </button>
        <a href="anasayfa.html" class="mt-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 inline-block">
            Ana Sayfaya Dön
        </a>
    `;
}

function renderCustomScenario() {
    const app = document.getElementById('app');
    if (!app) return;
    let html = `
        <h2 class="text-2xl font-bold mb-4">Kendi Senaryonu Test Et</h2>
        <p class="mb-4">Farklı notlarla ne olur, gör!</p>
        <div class="grid grid-cols-1 gap-4">
            ${courses.map(course => `
                <div class="p-4 bg-white rounded shadow analysis-box">
                    <h4 class="font-medium">${course.name}</h4>
                    <input id="scenario_grade_${course.id}" type="number" min="0" max="100" placeholder="Tahmini Not (0-100)" class="p-2 border rounded w-full mb-2" />
                    <p id="scenario_grade_${course.id}_error" class="error hidden">0-100 arasında bir not gir!</p>
                    <input id="scenario_comp_grade_${course.id}" type="number" min="0" max="100" placeholder="Rakip Tahmini Not (0-100)" class="p-2 border rounded w-full" />
                    <p id="scenario_comp_grade_${course.id}_error" class="error hidden">0-100 arasında bir not gir!</p>
                </div>
            `).join('')}
        </div>
        <button onclick="runCustomScenario()" class="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Sonuçları Gör
        </button>
        <a href="anasayfa.html" class="mt-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 inline-block">
            Ana Sayfaya Dön
        </a>
    `;
    app.innerHTML = html;
}

function runCustomScenario() {
    let hasError = false;
    const scenarioCourses = courses.map(course => {
        const grade = document.getElementById(`scenario_grade_${course.id}`).value;
        const error = document.getElementById(`scenario_grade_${course.id}_error`);
        if (grade && (parseFloat(grade) < 0 || parseFloat(grade) > 100)) {
            error.classList.remove('hidden');
            hasError = true;
        } else {
            error.classList.add('hidden');
        }
        return { ...course, grade };
    });
    const scenarioCompCourses = competitorCourses.map(course => {
        const grade = document.getElementById(`scenario_comp_grade_${course.id}`).value;
        const error = document.getElementById(`scenario_comp_grade_${course.id}_error`);
        if (grade && (parseFloat(grade) < 0 || parseFloat(grade) > 100)) {
            error.classList.remove('hidden');
            hasError = true;
        } else {
            error.classList.add('hidden');
        }
        return { ...course, grade };
    });
    if (hasError) return;
    const myAvg = scenarioCourses.filter(c => c.grade !== '' && !isNaN(parseFloat(c.grade)))
        .reduce((sum, c) => sum + parseFloat(c.grade), 0) / scenarioCourses.length;
    const compAvg = scenarioCompCourses.filter(c => c.grade !== '' && !isNaN(parseFloat(c.grade)))
        .reduce((sum, c) => sum + parseFloat(c.grade), 0) / scenarioCompCourses.length;
    const app = document.getElementById('app');
    app.innerHTML = `
        <h2 class="text-2xl font-bold mb-4">Senaryo Sonuçları</h2>
        <div class="p-6 bg-white rounded shadow analysis-box ${myAvg > compAvg ? 'green-box' : myAvg < compAvg ? 'red-box' : 'yellow-box'}">
            <p>Senin Ortalaman: <strong>${myAvg.toFixed(2)}</strong></p>
            <p>Rakibin Ortalaması: <strong>${compAvg.toFixed(2)}</strong></p>
            <p>Sonuç: <strong>${myAvg > compAvg ? 'Rakibi eziyorsun!' : myAvg < compAvg ? 'Rakip önde, kapan!' : 'Kapış kapış, eşit!'}</strong></p>
        </div>
        <button onclick="renderCustomScenario()" class="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Yeni Senaryo
        </button>
        <a href="anasayfa.html" class="mt-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 inline-block">
            Ana Sayfaya Dön
        </a>
    `;
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', initializeApp);



// 🔍 [EK ANALİZ MODÜLÜ] Ultra Gelişmiş Analizler

function calculateForgetRate(subjectHistory) {
    // Yapay zeka simülasyonu: unutma süresi tahmini (örnek)
    return subjectHistory.daysSinceLastStudy > 7 ? "Yüksek Unutma Riski" : "Kontrollü";
}

function getEfficiencyScore(studyHours, gradeImprovement) {
    const efficiency = (gradeImprovement / studyHours) * 100;
    return efficiency.toFixed(2) + "% verim";
}

function simulateFinalGrade(currentAvg, weeksLeft, improvementRate) {
    return (currentAvg + (weeksLeft * improvementRate)).toFixed(2);
}

function detectWeakSpots(subjects) {
    return subjects.filter(sub => sub.grade < 60).map(s => s.name);
}

function generateStrategyTips(user, rival) {
    return user.subjects.map((subject, i) => {
        const rivalSubject = rival.subjects[i];
        if (subject.grade < rivalSubject.grade) {
            return `${subject.name} dersinde rakip önde, ekstra tekrar önerilir.`;
        } else {
            return `${subject.name} dersinde sen öndesin, bu dersi koru.`;
        }
    });
}

// Örnek kullanım (demo veriler)
const user = {
    subjects: [
        { name: "Matematik", grade: 70, hours: 12 },
        { name: "Fizik", grade: 55, hours: 9 },
        { name: "Kimya", grade: 85, hours: 8 }
    ]
};

const rival = {
    subjects: [
        { name: "Matematik", grade: 75 },
        { name: "Fizik", grade: 60 },
        { name: "Kimya", grade: 80 }
    ]
};

console.log("🚨 Zayıf Noktalar:", detectWeakSpots(user.subjects));
console.log("📈 Verim Skoru:", getEfficiencyScore(8, 4)); // örnek: 8 saat → 4 puan artış
console.log("🔮 Final Not Tahmini:", simulateFinalGrade(72, 4, 1.2));
console.log("🧠 Stratejik Öneriler:", generateStrategyTips(user, rival));

