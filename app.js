window.supabaseClient = window.supabase.createClient(
  'https://opoxatdlqbzjqvecyjas.supabase.co',
  'sb_publishable_5w_YgHK-jugkSH0g-tFDSg_iUgj1fcB'
);
const pages = [...document.querySelectorAll('.page')];

let currentSession = null;
let authReady = false;

function showPage(id) {
  // Pengguna yang belum login hanya boleh membuka halaman akun
  if (id !== 'account' && (!authReady || !currentSession)) {
    id = 'account';
  }

  pages.forEach(p => {
    p.classList.toggle('active', p.id === id);
  });

  document.querySelectorAll('[data-page]').forEach(b => {
    b.classList.toggle('active', b.dataset.page === id);
  });

  document.getElementById('mainNav').classList.remove('open');

  if (id === 'map') renderResult();
  if (id === 'plan') renderSavedPlan();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Saat website pertama kali dibuka, tampilkan halaman akun
showPage('account');
// NAVIGASI ANTARHALAMAN
document.addEventListener('click', function(event) {
  const target = event.target.closest('[data-page]');
  if (!target) return;

  event.preventDefault();

  const pageId = target.dataset.page;
  if (pageId) showPage(pageId);
});

// MENU HAMBURGER
document.getElementById('menuToggle')?.addEventListener('click', function() {
  document.getElementById('mainNav')?.classList.toggle('open');
});
const questions=[
{q:'Aktivitas apa yang paling menarik bagimu?',a:['Membantu dan mendengarkan orang lain','Menganalisis angka atau memecahkan masalah','Membuat desain, tulisan, atau karya kreatif','Mengatur kegiatan dan bekerja dalam tim','Mencoba alat, teknologi, atau kegiatan praktik']},
{q:'Mata pelajaran atau topik apa yang paling ingin kamu pelajari?',a:['Bahasa dan ilmu sosial','Matematika dan sains','Seni, desain, dan komunikasi','Ekonomi dan kewirausahaan','Teknologi dan keterampilan praktik']},
{q:'Ketika mengerjakan tugas kelompok, peran apa yang sering kamu pilih?',a:['Mendukung anggota dan menjaga komunikasi','Mencari data dan menyusun analisis','Menyumbangkan ide dan konsep kreatif','Mengatur pembagian tugas dan jadwal','Mengerjakan bagian teknis atau praktik']},
{q:'Masalah seperti apa yang membuatmu tertarik mencari solusi?',a:['Masalah hubungan dan kebutuhan masyarakat','Pertanyaan ilmiah atau pola yang rumit','Cara menyampaikan pesan dengan menarik','Cara membuat kegiatan lebih teratur','Cara memperbaiki atau membuat sesuatu']},
{q:'Lingkungan kegiatan mana yang ingin kamu kenali?',a:['Lingkungan pendidikan atau pelayanan','Lingkungan penelitian atau analisis','Lingkungan kreatif dan media','Lingkungan organisasi atau bisnis','Lingkungan teknologi atau lapangan']},
{q:'Keterampilan apa yang ingin kamu kembangkan?',a:['Komunikasi dan empati','Analisis dan ketelitian','Kreativitas dan ekspresi','Kepemimpinan dan organisasi','Pemecahan masalah teknis']},
{q:'Kegiatan sukarela mana yang paling menarik?',a:['Menjadi pendamping belajar atau relawan sosial','Mengolah data untuk kegiatan penelitian','Membuat konten atau materi visual','Mengelola acara atau bazar','Membantu kegiatan teknologi atau praktik']},
{q:'Apa yang biasanya membuatmu merasa puas setelah menyelesaikan tugas?',a:['Ada orang yang terbantu','Menemukan jawaban yang tepat','Menghasilkan karya yang unik','Target tercapai dengan kerja sama','Berhasil membuat sesuatu berfungsi']},
{q:'Topik apa yang ingin kamu cari tahu lebih banyak?',a:['Pendidikan, psikologi, dan masyarakat','Sains, data, dan lingkungan','Desain, seni, dan media','Bisnis, manajemen, dan ekonomi','Komputer, rekayasa, dan teknologi']},
{q:'Jika memiliki waktu untuk proyek pribadi, apa yang ingin kamu coba?',a:['Membuat kegiatan yang bermanfaat bagi orang lain','Melakukan eksperimen atau analisis sederhana','Membuat karya kreatif','Merancang usaha atau acara kecil','Membuat solusi atau produk teknologi']}
];
const themes=['Sosial & Pendidikan','Sains & Analisis','Kreatif & Komunikasi','Bisnis & Organisasi','Teknologi & Praktik'];
let answers=JSON.parse(localStorage.getItem('cmAnswers')||'{}');let qi=0;
function renderQuestion(){const q=questions[qi],chosen=answers[qi]??'';document.getElementById('questionCount').textContent=`Pertanyaan ${qi+1} dari ${questions.length}`;document.getElementById('progressPercent').textContent=`${Math.round((qi+1)/questions.length*100)}%`;document.getElementById('progressBar').style.width=`${(qi+1)/questions.length*100}%`;document.getElementById('questionArea').innerHTML=`<div class="question-kicker">REFLEKSI DIRI</div><h2 class="question-title">${q.q}</h2><div class="answer-list">${q.a.map((a,i)=>`<label class="answer-option"><input type="radio" name="answer" value="${i}" ${String(chosen)===String(i)?'checked':''}><span>${a}</span></label>`).join('')}</div>`;document.getElementById('prevQuestion').disabled=qi===0;document.getElementById('nextQuestion').textContent=qi===questions.length-1?'Lihat ringkasan →':'Lanjut →';}
function storeAnswer(){const selected=document.querySelector('input[name="answer"]:checked');if(selected)answers[qi]=Number(selected.value);localStorage.setItem('cmAnswers',JSON.stringify(answers));}
document.getElementById('nextQuestion').addEventListener('click',()=>{storeAnswer();if(qi<questions.length-1){qi++;renderQuestion()}else{showPage('map')}});document.getElementById('prevQuestion').addEventListener('click',()=>{storeAnswer();if(qi>0){qi--;renderQuestion()}});document.getElementById('skipQuestion').addEventListener('click',()=>{delete answers[qi];localStorage.setItem('cmAnswers',JSON.stringify(answers));if(qi<questions.length-1){qi++;renderQuestion()}else showPage('map')});
function counts(){const c=[0,0,0,0,0];Object.values(answers).forEach(v=>{if(Number.isInteger(v)&&v>=0&&v<5)c[v]++});return c}
function renderResult(){const c=counts(),total=Object.keys(answers).length,sorted=themes.map((t,i)=>({t,n:c[i]})).sort((a,b)=>b.n-a.n);const el=document.getElementById('explorationResult');if(!total){el.innerHTML=`<div class="empty-state"><h2>Mulai dengan refleksi minat</h2><p>Belum ada jawaban yang tersimpan. Isi beberapa pertanyaan untuk melihat tema eksplorasi.</p><button class="btn primary" data-page="reflection">Isi refleksi minat →</button></div>`;return}const top=sorted.filter(x=>x.n>0).slice(0,3);el.innerHTML=`<span class="eyebrow">RINGKASAN JAWABAN</span><h2 style="font:700 22px Manrope;color:#142b52">Tema yang dapat kamu telusuri</h2><p style="font-size:12px;color:#718096">Kamu menjawab ${total} dari 10 pertanyaan. Tema berikut merangkum pilihanmu, bukan label atau penentuan karier.</p><div class="result-chips">${top.map(x=>`<span class="chip">${x.t} · ${x.n}</span>`).join('')}</div><p style="font-size:12px;line-height:1.8;color:#63748b">Coba buka menu Jelajah Karier dan Studi Lanjut untuk membandingkan beberapa pilihan. Minat dapat berkembang seiring pengalaman dan kesempatan belajar.</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px"><button class="btn primary" data-page="careers">Jelajah karier →</button><button class="btn secondary" data-page="reflection">Ulangi refleksi</button></div>`}
const careers=[
['✦','Guru / Pendidik','Membantu proses belajar, menyiapkan pembelajaran, dan mendampingi perkembangan peserta didik.','Komunikasi, penguasaan materi, perencanaan, empati.','Sosial & Pendidikan'],
['♡','Konselor','Memberikan layanan pendampingan sesuai pendidikan, kompetensi, dan kewenangan profesional.','Mendengarkan, komunikasi, etika, pemahaman manusia.','Sosial & Pendidikan'],
['⌁','Peneliti','Mengumpulkan dan menganalisis informasi untuk menjawab pertanyaan penelitian.','Berpikir kritis, ketelitian, metode penelitian.','Sains & Analisis'],
['▦','Analis Data','Membantu memahami data dan menyajikan temuan untuk mendukung keputusan.','Statistik, logika, pengolahan data, komunikasi.','Sains & Analisis'],
['✎','Desainer Grafis','Menyusun elemen visual untuk menyampaikan pesan atau informasi.','Kreativitas, komposisi, perangkat desain, komunikasi.','Kreatif & Komunikasi'],
['◉','Penulis Konten','Menyusun tulisan informatif atau kreatif untuk berbagai media.','Menulis, riset, penyuntingan, memahami audiens.','Kreatif & Komunikasi'],
['▤','Wirausahawan','Mengembangkan gagasan usaha, memahami kebutuhan pelanggan, dan mengelola kegiatan bisnis.','Inisiatif, perencanaan, komunikasi, pengelolaan.','Bisnis & Organisasi'],
['◎','Manajer Proyek','Mengoordinasikan tujuan, waktu, sumber daya, dan kerja tim dalam proyek.','Organisasi, komunikasi, pemecahan masalah.','Bisnis & Organisasi'],
['⌘','Pengembang Perangkat Lunak','Merancang, membuat, dan memelihara perangkat lunak.','Logika, pemrograman, kolaborasi, pemecahan masalah.','Teknologi & Praktik'],
['⚙','Teknisi','Melakukan pemeriksaan, perawatan, atau perbaikan peralatan sesuai bidangnya.','Keterampilan praktik, ketelitian, keselamatan kerja.','Teknologi & Praktik'],
['✚','Tenaga Kesehatan','Bekerja dalam layanan kesehatan sesuai pendidikan dan izin profesinya.','Ilmu kesehatan, komunikasi, ketelitian, empati.','Sosial & Pendidikan'],
['⌂','Perencana Lingkungan','Mempelajari dan membantu merancang pengelolaan lingkungan dan wilayah.','Analisis, sains, pemetaan, kerja lintas bidang.','Sains & Analisis']
];
function renderCareers(filter=''){const list=careers.filter(c=>c.join(' ').toLowerCase().includes(filter.toLowerCase()));document.getElementById('careerGrid').innerHTML=list.length?list.map(c=>`<article class="career-card"><span class="career-symbol">${c[0]}</span><h3>${c[1]}</h3><p>${c[2]}</p><small><b>Keterampilan:</b> ${c[3]}</small><p><span class="chip">${c[4]}</span></p></article>`).join(''):'<p class="micro-note">Belum ada profesi yang cocok dengan pencarian tersebut.</p>'}
document.getElementById('careerSearch').addEventListener('input',e=>renderCareers(e.target.value));renderCareers();
document.getElementById('planForm').addEventListener('submit',e=>{e.preventDefault();const p={goal:goal.value,steps:document.getElementById('steps').value,date:targetDate.value,support:support.value,note:reflectionNote.value};localStorage.setItem('cmPlan',JSON.stringify(p));document.getElementById('saveMessage').textContent='Rencana tersimpan di perangkat ini.';renderSavedPlan()});
function renderSavedPlan(){const p=JSON.parse(localStorage.getItem('cmPlan')||'null');document.getElementById('savedPlan').innerHTML=p?`<h3>${escapeHtml(p.goal)}</h3><p><b>Langkah:</b><br>${escapeHtml(p.steps)}</p><p><b>Target waktu:</b> ${escapeHtml(p.date||'Belum ditentukan')}</p><p><b>Dukungan:</b> ${escapeHtml(p.support||'Belum ditentukan')}</p><p><b>Refleksi:</b><br>${escapeHtml(p.note||'-')}</p>`:'Belum ada rencana yang disimpan.'}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
document.getElementById('printPlan').addEventListener('click',()=>window.print());renderQuestion();renderSavedPlan();
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));



// ===================================

// ===================================
// FITUR AKUN CAREER MAP - SUPABASE
// ===================================

const authMessage = document.getElementById('authMessage');

function showAuthMessage(message, isError = false) {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.style.color = isError ? '#c0392b' : '#247a4b';
}

// PENDAFTARAN AKUN SISWA
document.getElementById('registerButton')?.addEventListener('click', async () => {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  if (!name || !email || !password) {
    showAuthMessage('Nama, email, dan kata sandi harus diisi.', true);
    return;
  }

  if (password.length < 8) {
    showAuthMessage('Kata sandi minimal 8 karakter.', true);
    return;
  }

  const button = document.getElementById('registerButton');
  button.disabled = true;
  showAuthMessage('Sedang membuat akun...');

  try {
    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: 'https://nabilaoctavia.github.io/CAREER-MAP/'
      }
    });

    if (error) throw error;

    if (data.session) {
      showAuthMessage('Pendaftaran berhasil. Selamat datang!');
      showPage('home');
    } else {
      showAuthMessage('Pendaftaran berhasil. Silakan konfirmasi melalui email terlebih dahulu.');
    }
  } catch (error) {
    showAuthMessage('Pendaftaran gagal: ' + error.message, true);
  } finally {
    button.disabled = false;
  }
});

// MASUK KE AKUN
document.getElementById('loginButton')?.addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showAuthMessage('Email dan kata sandi harus diisi.', true);
    return;
  }

  const button = document.getElementById('loginButton');
  button.disabled = true;
  showAuthMessage('Sedang masuk...');

  try {
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    currentSession = data.session;
    authReady = true;
    showAuthMessage('Login berhasil. Selamat datang!');
    showPage('home');
  } catch (error) {
    showAuthMessage('Gagal masuk: ' + error.message, true);
  } finally {
    button.disabled = false;
  }
});

// PERIKSA STATUS LOGIN OTOMATIS
window.supabaseClient.auth.onAuthStateChange((event, session) => {
  currentSession = session;
  authReady = true;

  if (session) {
    showAuthMessage('Akun sedang masuk: ' + session.user.email);

    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
      showPage('home');
    }
  } else {
    showAuthMessage('Silakan masuk terlebih dahulu.');
    showPage('account');
  }
});

// KELUAR DARI AKUN
document.addEventListener('click', async (event) => {
  const button = event.target.closest('#logoutButton');

  if (!button) return;

  button.disabled = true;

  try {
    const { error } = await window.supabaseClient.auth.signOut();

    if (error) throw error;

    currentSession = null;
    showAuthMessage('Kamu berhasil keluar dari akun.');
   showPage('account');
  } catch (error) {
    showAuthMessage('Gagal keluar: ' + error.message, true);
  } finally {
    button.disabled = false;
  }
});
