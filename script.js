// Theme Toggle
const themeToggle = document.getElementById("themeToggle");

function setTheme(dark) {
  document.body.classList.toggle("dark", dark);
  localStorage.setItem("darkMode", dark);
  lucide.createIcons();
}

// Load saved theme
const savedTheme = localStorage.getItem("darkMode");
if (savedTheme === "true" || (savedTheme === null && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  setTheme(true);
}

themeToggle.addEventListener("click", () => {
  setTheme(!document.body.classList.contains("dark"));
});

// Inisialisasi icon lucide
lucide.createIcons();

// API Key Management
const apiKeyInput = document.getElementById("apiKeyInput");
const apiKeyBtn = document.getElementById("apiKeyBtn");

function getApiKey() {
  return localStorage.getItem("geminiApiKey") || "";
}

function updateApiKeyStatus() {
  const hasKey = getApiKey().length > 0;
  apiKeyBtn.classList.remove("api-set", "api-not-set");
  if (hasKey) {
    apiKeyBtn.classList.add("api-set");
    apiKeyBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i>';
  } else {
    apiKeyBtn.classList.add("api-not-set");
    apiKeyBtn.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4"></i>';
  }
  lucide.createIcons();
}

function openApiKeyModal() {
  apiKeyInput.value = getApiKey();
  document.getElementById("apiKeyModal").classList.remove("hidden");
}

function closeApiKeyModal() {
  document.getElementById("apiKeyModal").classList.add("hidden");
}

function saveApiKey() {
  const key = apiKeyInput.value.trim();
  if (key) {
    localStorage.setItem("geminiApiKey", key);
  } else {
    localStorage.removeItem("geminiApiKey");
  }
  closeApiKeyModal();
  updateApiKeyStatus();
}

updateApiKeyStatus();

// DOM Elements
const fileInput = document.getElementById("fileInput");
const uploadSection = document.getElementById("uploadSection");
const loadingSection = document.getElementById("loadingSection");
const loadingStatus = document.getElementById("loadingStatus");
const errorSection = document.getElementById("errorSection");
const errorMessage = document.getElementById("errorMessage");
const resultSection = document.getElementById("resultSection");
const btnReset = document.getElementById("btnReset");

const scoreValue = document.getElementById("scoreValue");
const ringkasanText = document.getElementById("ringkasanText");
const saranPengembanganText = document.getElementById("saranPengembanganText");
const headlineList = document.getElementById("headlineList");
const typoList = document.getElementById("typoList");
const kbbiList = document.getElementById("kbbiList");
const logikaSection = document.getElementById("logikaSection");
const logikaList = document.getElementById("logikaList");

function setView({ showUpload, showLoading, showError, showResult }) {
  uploadSection.classList.toggle("hidden", !showUpload);
  loadingSection.classList.toggle("hidden", !showLoading);
  errorSection.classList.toggle("hidden", !showError);
  resultSection.classList.toggle("hidden", !showResult);
}

function showErrorMsg(msg) {
  errorMessage.textContent = msg;
  setView({ showUpload: true, showLoading: false, showError: true, showResult: false });
  btnReset.classList.add("hidden");
}

async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      fullText += strings.join(" ") + "\n";
    }
    return fullText;
  } catch (err) {
    throw new Error("Gagal membaca file PDF. Pastikan file tidak terkunci atau rusak.");
  }
}

function getTextLimit() {
  const selected = document.querySelector('input[name="textLimit"]:checked');
  return selected ? parseInt(selected.value) : 5000;
}

const systemPrompt = `
Anda adalah Head of Editor Senior di harian berita nasional (Gaya Koran Besar).
Tugas Anda: Analisis naskah berita untuk kelayakan cetak.

PERATURAN KRITIS STRUKTUR JUDUL:
- IDENTIFIKASI: Bedakan dengan teliti antara "Judul Utama" (Headline) dan "Subjudul" (Dek/Lede).
- JANGAN PERNAH menjadikan subjudul sebagai judul utama dalam analisis.
- Opsi judul yang Anda berikan harus fokus pada perbaikan Judul Utama.

KRITERIA JUDUL GAYA KORAN (NENDANG):
- AKTIF: Gunakan kata kerja aktif yang kuat (contoh: "Hantam", "Tantang", "Guncang").
- PADAT: Hilangkan kata tugas yang tidak perlu (seperti 'yang', 'adalah', 'untuk') kecuali sangat krusial.
- BUKAN MAKALAH: Hindari judul deskriptif-akademis yang membosankan. Judul koran harus provokatif atau memberikan urgensi.
- CASE: Gunakan Title Case sesuai PUEBI (Bukan ALL CAPS).
- PANJANG: Panjang karakter alternatif_judul harus setara dengan judul_asli (+/- 10%) demi layout.

INTRUKSI BAHASA:
- Temukan typo, spasi ganda, dan diksi non-baku.
- Berikan saran diksi yang lebih "bernyawa" di bagian KBBI.

FORMAT OUTPUT WAJIB JSON.
`;

const responseSchema = {
  type: "object",
  properties: {
    skor_keseluruhan: { type: "number" },
    ringkasan: { type: "string" },
    daftar_berita: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          topik: { type: "string" },
          judul_asli: { type: "string" },
          subjudul_asli: { type: "string" },
          alternatif_judul: { type: "array", items: { type: "string" } },
          analisis_singkat: { type: "string" }
        },
        required: ["id", "topik", "judul_asli", "subjudul_asli", "alternatif_judul", "analisis_singkat"]
      }
    },
    temuan: {
      type: "object",
      properties: {
        typo: {
          type: "array",
          items: {
            type: "object",
            properties: {
              salah: { type: "string" },
              perbaikan: { type: "string" },
              hint_lokasi: { type: "string" }
            }
          }
        },
        kbbi: {
          type: "array",
          items: {
            type: "object",
            properties: {
              kata: { type: "string" },
              saran: { type: "string" },
              alasan: { type: "string" },
              hint_lokasi: { type: "string" }
            }
          }
        },
        logika: { type: "array", items: { type: "string" } }
      }
    },
    saran_pengembangan: { type: "string" }
  },
  required: ["skor_keseluruhan", "ringkasan", "daftar_berita", "temuan", "saran_pengembangan"]
};

async function analyzeContent(content) {
  let retries = 0;
  const maxRetries = 5;

  while (retries < maxRetries) {
    try {
      const resp = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + getApiKey(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: "Analisis teks berikut. Pisahkan antara Judul Utama dan Subjudul. Berikan alternatif judul GAYA KORAN yang jauh lebih nendang, berani, dan kuat dibanding judul asli. Fokus pada kata kerja aktif dan urgensi, namun tetap akurat:\n\n" + content.substring(0, getTextLimit())
              }]
            }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
              responseSchema
            }
          })
        }
      );

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Error API (${resp.status}): ${text}`);
      }

      const data = await resp.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (err) {
      retries++;
      const delay = Math.pow(2, retries) * 1000;
      await new Promise((res) => setTimeout(res, delay));
      if (retries === maxRetries) {
        throw new Error("Gagal menghubungi AI. Silakan coba lagi.");
      }
    }
  }
}

function renderResult(analysis) {
  scoreValue.textContent = analysis.skor_keseluruhan;
  
  ringkasanText.textContent = `"${analysis.ringkasan}"`;
  saranPengembanganText.textContent = analysis.saran_pengembangan || "";

  headlineList.innerHTML = "";
  (analysis.daftar_berita || []).forEach((berita, idx) => {
    const card = document.createElement("div");
    card.className = "card rounded-xl overflow-hidden border";

    const top = document.createElement("div");
    top.className = "p-5 border-b";

    const headerFlex = document.createElement("div");
    headerFlex.className = "flex flex-wrap items-start gap-4 mb-4";

    const left = document.createElement("div");
    left.className = "flex-1";

    const badge = document.createElement("span");
    badge.className = "gradient-bg text-white text-[10px] font-medium px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block";
    badge.textContent = `Naskah ${idx + 1} • ${berita.topik}`;

    const space = document.createElement("div");
    space.className = "space-y-3";

    const judulBlock = document.createElement("div");
    const judulLabel = document.createElement("span");
    judulLabel.className = "text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1";
    judulLabel.textContent = "Judul Utama Asli:";
    const judul = document.createElement("h4");
    judul.className = "text-lg font-bold text-slate-800 leading-snug";
    judul.textContent = `"${berita.judul_asli}"`;
    judulBlock.appendChild(judulLabel);
    judulBlock.appendChild(judul);
    space.appendChild(judulBlock);

    if (berita.subjudul_asli) {
      const subBlock = document.createElement("div");
      const subLabel = document.createElement("span");
      subLabel.className = "text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1";
      subLabel.textContent = "Subjudul / Dek:";
      const sub = document.createElement("p");
      sub.className = "text-sm text-slate-500 leading-relaxed";
      sub.textContent = berita.subjudul_asli;
      subBlock.appendChild(subLabel);
      subBlock.appendChild(sub);
      space.appendChild(subBlock);
    }

    left.appendChild(badge);
    left.appendChild(space);
    headerFlex.appendChild(left);
    top.appendChild(headerFlex);

    const analBox = document.createElement("div");
    analBox.className = "p-3 bg-blue-50 rounded-lg border border-blue-200 mt-3";
    const analText = document.createElement("p");
    analText.className = "text-xs text-blue-800 font-medium";
    analText.innerHTML = '<span class="font-medium uppercase mr-1">Analisis:</span>' + (berita.analisis_singkat || "");
    analBox.appendChild(analText);
    top.appendChild(analBox);

    const bottomGrid = document.createElement("div");
    bottomGrid.className = "grid grid-cols-1 md:grid-cols-3";

    (berita.alternatif_judul || []).forEach((judulAlt, i) => {
      const col = document.createElement("div");
      col.className = "p-6 " + (i !== 2 ? "md:border-r border-slate-200 " : "");

      const metaRow = document.createElement("div");
      metaRow.className = "text-[10px] font-medium text-blue-600 uppercase tracking-wider mb-3 flex justify-between";
      const span1 = document.createElement("span");
      span1.textContent = `Opsi ${i + 1}`;
      const span2 = document.createElement("span");
      span2.className = "text-slate-400";
      span2.textContent = `${judulAlt.length} Karakter`;
      metaRow.appendChild(span1);
      metaRow.appendChild(span2);

      const textP = document.createElement("p");
      textP.className = "text-base font-bold text-slate-900 leading-snug";
      textP.textContent = judulAlt;

      col.appendChild(metaRow);
      col.appendChild(textP);
      bottomGrid.appendChild(col);
    });

    card.appendChild(top);
    card.appendChild(bottomGrid);
    headlineList.appendChild(card);
    lucide.createIcons();
  });

  // Typo
  typoList.innerHTML = "";
  if (analysis.temuan.typo && analysis.temuan.typo.length > 0) {
    analysis.temuan.typo.forEach((item) => {
      const box = document.createElement("div");
      box.className = "p-4 bg-slate-50 rounded-lg border border-slate-200";
      box.innerHTML = `
        <div class="flex items-center gap-2 mb-2">
          <span class="line-through text-slate-400 text-sm">${item.salah}</span>
          <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
          <span class="bg-rose-500 text-white px-2 py-1 rounded text-sm">${item.perbaikan}</span>
        </div>
        <p class="text-xs text-slate-500 flex items-center gap-1">
          <i data-lucide="map-pin" class="w-3 h-3"></i> "${item.hint_lokasi}"
        </p>
      `;
      typoList.appendChild(box);
    });
  } else {
    const box = document.createElement("div");
    box.className = "p-5 bg-emerald-50 rounded-lg border border-emerald-200 text-center";
    box.innerHTML = `
      <i data-lucide="check-circle-2" class="text-emerald-500 w-5 h-5 mx-auto mb-2"></i>
      <p class="text-sm text-emerald-700 font-medium uppercase tracking-wider">Naskah Bersih Typo</p>
    `;
    typoList.appendChild(box);
  }

  // KBBI
  kbbiList.innerHTML = "";
  if (analysis.temuan.kbbi && analysis.temuan.kbbi.length > 0) {
    analysis.temuan.kbbi.forEach((item) => {
      const box = document.createElement("div");
      box.className = "p-4 bg-blue-50 rounded-lg border border-blue-200";
      box.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <span class="text-sm font-bold text-blue-900">${item.kata}</span>
          <span class="text-[10px] font-medium text-blue-600 bg-white border border-blue-200 px-2 py-1 rounded uppercase tracking-wider">Ganti: ${item.saran}</span>
        </div>
        <p class="text-sm text-slate-600 mb-2 leading-relaxed">${item.alasan}</p>
        <p class="text-xs text-blue-500 flex items-center gap-1">
          <i data-lucide="map-pin" class="w-3 h-3"></i> "${item.hint_lokasi}"
        </p>
      `;
      kbbiList.appendChild(box);
    });
  } else {
    const box = document.createElement("div");
    box.className = "p-6 bg-blue-50 rounded-lg border border-blue-200 text-center";
    box.innerHTML = `
      <i data-lucide="check-circle-2" class="text-blue-500 w-6 h-6 mx-auto mb-2"></i>
      <p class="text-sm text-blue-700 font-medium uppercase tracking-wider">Diksi Sangat Kuat</p>
    `;
    kbbiList.appendChild(box);
  }

  // Logika
  logikaList.innerHTML = "";
  if (analysis.temuan.logika && analysis.temuan.logika.length > 0) {
    logikaSection.classList.remove("hidden");
    analysis.temuan.logika.forEach((log) => {
      const box = document.createElement("div");
      box.className = "bg-white/60 p-3 rounded-lg border border-amber-200 text-sm text-amber-800";
      box.textContent = "- " + log;
      logikaList.appendChild(box);
    });
  } else {
    logikaSection.classList.add("hidden");
  }

  lucide.createIcons();
}

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = null;
  if (!file) return;

  if (!getApiKey()) {
    openApiKeyModal();
    return;
  }

  errorMessage.textContent = "";
  setView({ showUpload: false, showLoading: true, showError: false, showResult: false });
  loadingStatus.textContent = "Mengekstrak teks PDF...";

  try {
    const extractedText = await extractTextFromPDF(file);
    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error("Teks tidak terdeteksi. Pastikan PDF bukan hasil scan gambar.");
    }

    loadingStatus.textContent = "AI sedang membedah naskah...";
    const analysis = await analyzeContent(extractedText);

    renderResult(analysis);
    setView({ showUpload: false, showLoading: false, showError: false, showResult: true });
    btnReset.classList.remove("hidden");
    btnReset.classList.add("flex");
  } catch (err) {
    showErrorMsg(err.message || "Terjadi kesalahan.");
  }
});

btnReset.addEventListener("click", () => {
  fileInput.value = null;
  scoreValue.textContent = "0";
  ringkasanText.textContent = "";
  saranPengembanganText.textContent = "";
  headlineList.innerHTML = "";
  typoList.innerHTML = "";
  kbbiList.innerHTML = "";
  logikaList.innerHTML = "";
  logikaSection.classList.add("hidden");
  btnReset.classList.add("hidden");
  btnReset.classList.remove("flex");
  setView({ showUpload: true, showLoading: false, showError: false, showResult: false });
});