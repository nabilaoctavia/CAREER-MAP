window.supabaseClient = window.supabase.createClient(
  'https://opoxatdlqbzjqvecyjas.supabase.co',
  'sb_publishable_5w_YgHK-jugkSH0g-tFDSg_iUgj1fcB'
);
const pages = [...document.querySelectorAll('.page')];

let currentSession = null;
let authReady = false;

let currentRole = null;
let currentApprovalStatus = null;

// Mengambil role akun yang sedang login
async function loadCurrentRole(session) {
  if (!session?.user?.id) {
    currentRole = null;
    return;
  }

  const { data, error } = await window.supabaseClient
    .from('profiles')
    .select('role,approval_status')
    .eq('id', session.user.id)
    .single();

  if (error) {
    currentRole = null;
    console.error('Gagal memeriksa role:', error);
    return;
  }

  currentRole = data.role;
  currentApprovalStatus = data.approval_status || (data.role === 'student' ? 'pending' : 'approved');
  console.log('Role akun:', currentRole, 'status:', currentApprovalStatus);
}



function showPage(id) {
  // Dashboard dipisahkan berdasarkan jenis akun.
  if (authReady && currentSession && currentRole === 'counselor' &&
      ['home','reflection','map','careers','study','plan'].includes(id)) id = 'counselorDashboard';
  if (authReady && currentSession && currentRole === 'student' &&
      id === 'counselorDashboard') id = 'home';

  // Menu dan seluruh halaman aplikasi hanya tersedia setelah login
  if (!['account', 'register'].includes(id) && (!authReady || !currentSession || !currentRole)) {
    id = 'account';
  }

  // Tampilkan kerangka aplikasi (sidebar, header, footer) hanya untuk akun yang sudah login
  document.body.classList.toggle(
    'is-authenticated',
    Boolean(authReady && currentSession && currentRole)
  );

  if (['counselorCodes','counselorStudents'].includes(id) && currentRole !== 'counselor') id = 'home';

  // Halaman admin hanya boleh dibuka oleh admin
  if (id === 'admin' && currentRole !== 'admin') {
    id = 'home';
  }


  pages.forEach(p => {
    p.classList.toggle('active', p.id === id);
  });

  document.querySelectorAll('[data-page]').forEach(b => {
    b.classList.toggle('active', b.dataset.page === id);
  });

  document.getElementById('sideBar')?.classList.remove('open');
  document.getElementById('sidebarBackdrop')?.classList.remove('visible');
  document.getElementById('menuToggle')?.setAttribute('aria-expanded', 'false');
  document.getElementById('menuToggle')?.setAttribute('aria-label', 'Buka menu');
  closeAccountDropdown();

  if (id === 'map') renderResult();
  if (id === 'plan') renderSavedPlan();
  if (id === 'admin') loadAdminDashboard();
  if (id === 'counselorDashboard') loadCounselorDashboard();
  if (id === 'counselorCodes') loadCounselorClassCodes();
  if (id === 'counselorStudents') loadCounselorStudents();
  ['counselorCodesNav','counselorStudentsNav','counselorHomeNav'].forEach(navId => {
    const el = document.getElementById(navId);
    if (el) el.hidden = currentRole !== 'counselor';
  });
  if (id === 'counsel') loadCounselingPage();
  if (id === 'profile') loadUserProfile();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// NAVIGASI ANTARHALAMAN
document.addEventListener('click', function(event) {
  const target = event.target.closest('[data-page]');
  if (!target) return;

  event.preventDefault();
  showPage(target.dataset.page);
});

// BUKA / TUTUP MENU SAMPING
function closeSidebar() {
  document.getElementById('sideBar')?.classList.remove('open');
  document.getElementById('sidebarBackdrop')?.classList.remove('visible');
  document.getElementById('menuToggle')?.setAttribute('aria-expanded', 'false');
  document.getElementById('menuToggle')?.setAttribute('aria-label', 'Buka menu');
}

document.getElementById('menuToggle')?.addEventListener('click', function() {
  const sidebar = document.getElementById('sideBar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const willOpen = !sidebar?.classList.contains('open');
  sidebar?.classList.toggle('open', willOpen);
  backdrop?.classList.toggle('visible', willOpen);
  this.setAttribute('aria-expanded', String(willOpen));
  this.setAttribute('aria-label', willOpen ? 'Tutup menu' : 'Buka menu');
});

document.getElementById('sidebarClose')?.addEventListener('click', closeSidebar);
document.getElementById('sidebarBackdrop')?.addEventListener('click', closeSidebar);

// MENU PROFIL DI POJOK KANAN ATAS
function closeAccountDropdown() {
  const dropdown = document.getElementById('accountDropdown');
  const toggle = document.getElementById('accountMenuToggle');
  dropdown?.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
}

document.getElementById('accountMenuToggle')?.addEventListener('click', (event) => {
  event.stopPropagation();
  const dropdown = document.getElementById('accountDropdown');
  const toggle = document.getElementById('accountMenuToggle');
  const willOpen = !dropdown?.classList.contains('open');
  dropdown?.classList.toggle('open', willOpen);
  toggle?.setAttribute('aria-expanded', String(willOpen));
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('#topbarAccount')) closeAccountDropdown();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeAccountDropdown();
    closeSidebar();
  }
});

// TAMPILKAN HALAMAN AWAL
showPage('account');

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
function renderCareers(filter='') {
  const list = careers.filter(c =>
    c.join(' ').toLowerCase().includes(filter.toLowerCase())
  );

  const grid = document.getElementById('careerGrid');
  const detail = document.getElementById('careerDetail');

  if (detail) detail.hidden = true;

  grid.innerHTML = list.length
    ? list.map((c, index) => `
      <article class="career-card"
        data-career-index="${careers.indexOf(c)}"
        tabindex="0"
        role="button"
        aria-label="Lihat detail ${c[1]}">

        <span class="career-symbol">${c[0]}</span>
        <h3>${c[1]}</h3>
        <p>${c[2]}</p>
        <small><b>Keterampilan:</b> ${c[3]}</small>
        <p><span class="chip">${c[4]}</span></p>
        <small><b>⤴ Klik untuk melihat detail</b></small>
      </article>
    `).join('')
    : '<p class="micro-note">Belum ada profesi yang cocok dengan pencarian tersebut.</p>';
}

// Membuka detail saat kartu profesi diklik
document.getElementById('careerGrid').addEventListener('click', e => {
  const card = e.target.closest('.career-card');
  if (!card) return;

  const c = careers[Number(card.dataset.careerIndex)];
  const detail = document.getElementById('careerDetail');
  const content = document.getElementById('careerDetailContent');

  if (!c || !detail || !content) return;

  content.innerHTML = `
    <span class="career-symbol">${c[0]}</span>
    <h2>${c[1]}</h2>
    <p>${c[2]}</p>

    <h3>Bidang Karier</h3>
    <p>${c[4]}</p>

    <h3>Keterampilan yang Dibutuhkan</h3>
    <p>${c[3]}</p>

    <h3>Hal yang Dapat Dipelajari</h3>
    <p>Pelajari pengetahuan dasar bidang ini, kembangkan keterampilan yang relevan, dan cari pengalaman melalui kegiatan belajar atau proyek sederhana.</p>

    <h3>Catatan untuk Siswa</h3>
    <p>Informasi ini merupakan gambaran awal untuk eksplorasi karier. Pilihan pendidikan dan persyaratan profesi dapat berbeda-beda.</p>
  `;

  detail.hidden = false;
  detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Tombol tutup detail
document.getElementById('closeCareerDetail').addEventListener('click', () => {
  document.getElementById('careerDetail').hidden = true;
});

// Pencarian profesi
document.getElementById('careerSearch').addEventListener('input', e => {
  renderCareers(e.target.value);
});

renderCareers();
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
  ['authMessage', 'registerMessage'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.style.color = isError ? '#c0392b' : '#247a4b';
  });
}

function formatSupabaseError(error) {
  if (!error) return 'Kesalahan tidak diketahui.';
  const parts = [error.message, error.details, error.hint, error.code ? `Kode: ${error.code}` : '']
    .filter(Boolean);
  return parts.join(' | ');
}

// PENDAFTARAN AKUN SISWA
document.getElementById('registerButton')?.addEventListener('click', async () => {
  const name = document.getElementById('registerName').value.trim();
  const classCode = document.getElementById('registerClassCode')?.value.trim().toUpperCase() || '';
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  if (!name || !classCode || !email || !password) {
    showAuthMessage('Nama, kode kelas, email, dan kata sandi harus diisi.', true);
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
        data: { full_name: name, class_code: classCode },
        emailRedirectTo: 'https://nabilaoctavia.github.io/CAREER-MAP/'
      }
    });

    if (error) throw error;

    if (data.session) {
      currentSession = data.session;
      authReady = true;
      await loadCurrentRole(data.session);
      await window.supabaseClient.auth.signOut();
      currentSession = null;
      authReady = true;
      currentRole = null;
      showPage('account');
      showAuthMessage('Pendaftaran berhasil. Kode kelas diterima. Akun menunggu konfirmasi email dan persetujuan Admin.');
    } else {
      showPage('account');
      showAuthMessage('Pendaftaran berhasil. Silakan konfirmasi email. Akun akan terhubung ke Guru BK pemilik kode dan menunggu persetujuan Admin.');
    }
  } catch (error) {
    showAuthMessage('Pendaftaran gagal: ' + error.message, true);
  } finally {
    button.disabled = false;
  }
});


// PENDAFTARAN AKUN GURU BK
document.getElementById('counselorRegisterButton')?.addEventListener('click', async () => {
  const name = document.getElementById('counselorName').value.trim();
  const email = document.getElementById('counselorEmail').value.trim();
  const password = document.getElementById('counselorPassword').value;
  const school = document.getElementById('counselorSchool').value.trim();
  const level = document.getElementById('counselorLevel').value;

  if (!name || !email || !password || !school || !level) {
    showAuthMessage('Semua data Guru BK harus diisi.', true);
    return;
  }

  if (password.length < 8) {
    showAuthMessage('Kata sandi minimal 8 karakter.', true);
    return;
  }

  const button = document.getElementById('counselorRegisterButton');
  button.disabled = true;
  showAuthMessage('Sedang mengirim pengajuan Guru BK...');

  try {
    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          account_type: 'counselor',
          full_name: name,
          school_name: school,
          school_level: level
        },
        emailRedirectTo: 'https://nabilaoctavia.github.io/CAREER-MAP/'
      }
    });

    if (error) throw error;

    showPage('account');
    showAuthMessage(
      'Pengajuan Guru BK berhasil dikirim. Silakan konfirmasi email. Akun menunggu persetujuan Admin.'
    );

  } catch (error) {
    showAuthMessage('Pengajuan gagal: ' + error.message, true);
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

await loadCurrentRole(data.session);

if (currentRole === 'student' && currentApprovalStatus !== 'approved') {
  await window.supabaseClient.auth.signOut();
  currentSession = null;
  authReady = true;
  currentRole = null;
  const pendingText = currentApprovalStatus === 'rejected'
    ? 'Pendaftaran akun siswa ditolak Admin. Hubungi pihak sekolah untuk informasi lebih lanjut.'
    : 'Akun siswa kamu masih menunggu persetujuan Admin. Silakan coba login kembali setelah disetujui.';
  showAuthMessage(pendingText, true);
  showPage('account');
  return;
}

showAuthMessage('Login berhasil. Selamat datang!');

if (currentRole === 'admin') {
  showAuthMessage('Login berhasil. Selamat datang, Admin!');
}

showPage(currentRole === 'counselor' ? 'counselorDashboard' : currentRole === 'student' ? 'home' : 'profile');
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

  const params = new URLSearchParams(window.location.search);
  const isRecovery =
    event === 'PASSWORD_RECOVERY' ||
    params.get('type') === 'recovery' ||
    window.location.hash.includes('type=recovery');

  if (isRecovery) {
    const resetBox = document.getElementById('resetPasswordBox');

    if (resetBox) {
      resetBox.hidden = false;
    }

    showPage('account');
    showAuthMessage('Silakan buat kata sandi baru untuk akunmu.');
    return;
  }

  if (session) {
    showAuthMessage('Akun sedang masuk: ' + session.user.email);

    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
      Promise.resolve().then(async () => {
        await loadCurrentRole(session);

        if (currentRole === 'student' && currentApprovalStatus !== 'approved') {
          const pendingText = currentApprovalStatus === 'rejected'
            ? 'Pendaftaran akun siswa ditolak Admin. Hubungi pihak sekolah.'
            : 'Akun siswa masih menunggu persetujuan Admin.';
          await window.supabaseClient.auth.signOut();
          currentSession = null;
          currentRole = null;
          showAuthMessage(pendingText, true);
          showPage('account');
          return;
        }

        const adminLink = document.getElementById('adminNavLink');
        if (adminLink) {
          adminLink.hidden = currentRole !== 'admin';
        }

        showPage(currentRole === 'counselor' ? 'counselorDashboard' : currentRole === 'student' ? 'home' : 'profile');
      });
    }
  } else {
    if (typeof cmStopNotificationService === 'function') cmStopNotificationService();
    currentRole = null;
    currentApprovalStatus = null;

    const adminLink = document.getElementById('adminNavLink');
    if (adminLink) adminLink.hidden = true;

    showAuthMessage('Silakan masuk terlebih dahulu.');
    showPage('account');
  }
});


// KELUAR DARI AKUN
document.addEventListener('click', async (event) => {
  const button = event.target.closest('#logoutButton, #profileLogoutButton, #topbarLogoutButton');

  if (!button) return;

  button.disabled = true;

  try {
    const { error } = await window.supabaseClient.auth.signOut();

    if (error) throw error;

    currentSession = null;
    currentRole = null;
    currentApprovalStatus = null;
    showAuthMessage('Kamu berhasil keluar dari akun.');
   showPage('account');
  } catch (error) {
    showAuthMessage('Gagal keluar: ' + error.message, true);
  } finally {
    button.disabled = false;
  }
});

// ===================================
// DASHBOARD ADMIN CAREER MAP
// ===================================

async function loadAdminDashboard() {
  if (currentRole !== 'admin') return;

  const studentList = document.getElementById('adminStudentList');
  const counselorList = document.getElementById('adminCounselorList');
  const applicationList = document.getElementById('adminApplicationList');

  if (!studentList || !counselorList || !applicationList) {
    console.error('Elemen Dashboard Admin tidak ditemukan.');
    return;
  }

  studentList.innerHTML = '<tr><td colspan="3">Memuat data...</td></tr>';
  counselorList.innerHTML = '<tr><td colspan="3">Memuat data...</td></tr>';
  applicationList.innerHTML = '<tr><td colspan="6">Memuat pengajuan...</td></tr>';

  const { data, error } = await window.supabaseClient.rpc(
    'admin_get_user_summary'
  );

  if (error) {
    console.error('Gagal mengambil data pengguna:', error);
    return;
  }

  const { data: applications, error: applicationError } =
    await window.supabaseClient
      .from('counselor_applications')
      .select('id,user_id,full_name,school_name,school_level,status,submitted_at')
      .order('submitted_at', { ascending: false });

  if (applicationError) {
    console.error('Gagal mengambil pengajuan Guru BK:', applicationError);
    applicationList.innerHTML =
      '<tr><td colspan="6">Gagal memuat pengajuan.</td></tr>';
    return;
  }

  const { data: pendingStudents, error: pendingStudentError } =
    await window.supabaseClient.rpc('admin_list_pending_students');

  const pendingStudentList = document.getElementById('adminPendingStudentList');
  if (pendingStudentList) {
    if (pendingStudentError) {
      console.error('Gagal memuat pendaftaran siswa:', pendingStudentError);
      pendingStudentList.innerHTML = '<tr><td colspan="5">Gagal memuat pendaftaran siswa. Periksa SQL dan izin Admin.</td></tr>';
    } else if (!pendingStudents || !pendingStudents.length) {
      pendingStudentList.innerHTML = '<tr><td colspan="5">Belum ada pendaftaran siswa yang menunggu.</td></tr>';
    } else {
      pendingStudentList.innerHTML = pendingStudents.map(student => `
        <tr>
          <td>${escapeHtml(student.full_name || 'Tanpa nama')}</td>
          <td>${escapeHtml(student.email || '-')}</td>
          <td>${student.created_at ? new Date(student.created_at).toLocaleDateString('id-ID') : '-'}</td>
          <td>Menunggu</td>
          <td>
            <button type="button" data-review-student="approved" data-student-id="${escapeHtml(student.id)}">Setujui</button>
            <button type="button" data-review-student="rejected" data-student-id="${escapeHtml(student.id)}">Tolak</button>
          </td>
        </tr>`).join('');
    }
    pendingStudentList.onclick = async function(event) {
      const button = event.target.closest('[data-review-student]');
      if (!button) return;
      const decision = button.dataset.reviewStudent;
      const studentId = button.dataset.studentId;
      const verb = decision === 'approved' ? 'menyetujui' : 'menolak';
      if (!confirm(`Yakin ingin ${verb} pendaftaran siswa ini?`)) return;
      button.disabled = true;
      button.textContent = 'Memproses...';
      const { error: reviewError } = await window.supabaseClient.rpc('admin_review_student_registration', {
        p_student_id: studentId,
        p_decision: decision
      });
      if (reviewError) {
        console.error('Gagal memproses pendaftaran siswa:', reviewError);
        alert('Gagal memproses. Pastikan SQL persetujuan siswa sudah dijalankan.');
      } else {
        alert(decision === 'approved' ? 'Siswa berhasil disetujui.' : 'Pendaftaran siswa ditolak.');
      }
      await loadAdminDashboard();
    };
  }

  const pendingApplications = applications.filter(
    application => application.status === 'pending'
  );

  const pendingUserIds = new Set(
    pendingApplications.map(application => application.user_id)
  );
  const pendingStudentIds = new Set((pendingStudents || []).map(student => student.id));

  const students = data.filter(
    user => user.role === 'student' &&
      !pendingUserIds.has(user.id) &&
      !pendingStudentIds.has(user.id)
  );

  const counselors = data.filter(user => user.role === 'counselor');

  document.getElementById('adminStudentCount').textContent = students.length;
  document.getElementById('adminCounselorCount').textContent = counselors.length;
  document.getElementById('adminTotalCount').textContent =
    students.length + counselors.length + pendingApplications.length + (pendingStudents || []).length;

  function makeRows(users) {
    if (!users.length) {
      return '<tr><td colspan="3">Belum ada data.</td></tr>';
    }

    return users.map(user => {
      const name = escapeHtml(user.display_name || 'Tanpa nama');
      const email = escapeHtml(user.email || '-');
      const date = user.created_at
        ? new Date(user.created_at).toLocaleDateString('id-ID')
        : '-';

      return `
        <tr>
          <td>${name}</td>
          <td>${email}</td>
          <td>${date}</td>
        </tr>
      `;
    }).join('');
  }

  studentList.innerHTML = makeRows(students);
  counselorList.innerHTML = makeRows(counselors);

  if (!pendingApplications.length) {
    applicationList.innerHTML =
      '<tr><td colspan="6">Belum ada pengajuan yang menunggu persetujuan.</td></tr>';
  } else {
    applicationList.innerHTML = pendingApplications.map(application => {
      const user = data.find(item => item.id === application.user_id);
      const name = escapeHtml(application.full_name || 'Tanpa nama');
      const email = escapeHtml(user?.email || '-');
      const school = escapeHtml(application.school_name || '-');
      const level = escapeHtml(application.school_level || '-');

      return `
        <tr>
          <td>${name}</td>
          <td>${email}</td>
          <td>${school}</td>
          <td>${level}</td>
          <td>Menunggu</td>
          <td>
            <button
              type="button"
              data-review-application="approved"
              data-application-id="${escapeHtml(application.id)}">
              Setujui
            </button>
            <button
              type="button"
              data-review-application="rejected"
              data-application-id="${escapeHtml(application.id)}">
              Tolak
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  applicationList.onclick = async function(event) {
    const button = event.target.closest('[data-review-application]');
    if (!button) return;

    const decision = button.dataset.reviewApplication;
    const applicationId = button.dataset.applicationId;
    const actionText = decision === 'approved' ? 'menyetujui' : 'menolak';

    if (!confirm(`Yakin ingin ${actionText} pengajuan Guru BK ini?`)) {
      return;
    }

    button.disabled = true;
    button.textContent = 'Memproses...';

    const { error: reviewError } = await window.supabaseClient.rpc(
      'admin_review_counselor_application',
      {
        p_application_id: applicationId,
        p_decision: decision
      }
    );

    if (reviewError) {
      console.error('Gagal memproses pengajuan:', reviewError);
      alert('Pengajuan gagal diproses. Silakan periksa Console.');
      await loadAdminDashboard();
      return;
    }

    alert(
      decision === 'approved'
        ? 'Pengajuan Guru BK berhasil disetujui.'
        : 'Pengajuan Guru BK berhasil ditolak.'
    );

    await loadAdminDashboard();
  };
}



// ===================================
// PEMULIHAN PASSWORD CAREER MAP
// ===================================

const saveNewPasswordButton = document.getElementById('saveNewPasswordButton');

if (saveNewPasswordButton) {
  saveNewPasswordButton.addEventListener('click', async () => {
    const newPassword = document.getElementById('newPassword').value;

    if (newPassword.length < 8) {
      showAuthMessage('Kata sandi minimal 8 karakter.');
      return;
    }

    saveNewPasswordButton.disabled = true;

    const { error } = await window.supabaseClient.auth.updateUser({
      password: newPassword
    });

    saveNewPasswordButton.disabled = false;

    if (error) {
      console.error('Gagal memperbarui password:', error);
      showAuthMessage('Gagal memperbarui kata sandi: ' + error.message);
      return;
    }

    showAuthMessage('Kata sandi berhasil diperbarui. Silakan masuk kembali.');

    document.getElementById('resetPasswordBox').hidden = true;
    document.getElementById('newPassword').value = '';

    await window.supabaseClient.auth.signOut();
  });
}

// TOMBOL LUPA PASSWORD
const forgotPasswordButton = document.getElementById('forgotPasswordButton');

if (forgotPasswordButton) {
  forgotPasswordButton.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();

    if (!email) {
      showAuthMessage('Masukkan email akun Guru BK terlebih dahulu.', true);
      return;
    }

    forgotPasswordButton.disabled = true;
    showAuthMessage('Sedang mengirim email pemulihan...');

    try {
      const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://nabilaoctavia.github.io/CAREER-MAP/'
      });

      if (error) throw error;

      showAuthMessage('Email pemulihan berhasil dikirim. Silakan periksa kotak masuk emailmu.');
    } catch (error) {
      showAuthMessage('Gagal mengirim email: ' + error.message, true);
    } finally {
      forgotPasswordButton.disabled = false;
    }
  });
}



// ===================================
// PROFIL PENGGUNA & JADWAL KONSELING
// ===================================

function currentUserName() {
  return currentSession?.user?.user_metadata?.full_name ||
    currentSession?.user?.email?.split('@')[0] || 'Siswa';
}

async function loadUserProfile() {
  if (!currentSession?.user) return;
  const user = currentSession.user;
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '-';
  };
  const formatDate = (value) => value
    ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : '-';

  let profileData = null;
  // Ambil baris profil milik akun aktif; tidak membaca data pengguna lain.
  const { data: ownProfile, error: profileError } = await window.supabaseClient
    .from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (profileError) console.warn('Data tambahan profil tidak dapat dimuat:', profileError.message);
  else profileData = ownProfile;

  const displayName = profileData?.display_name || profileData?.full_name ||
    user.user_metadata?.full_name || user.user_metadata?.name || currentUserName();
  const roleLabel = currentRole === 'student' ? 'Siswa' :
    currentRole === 'counselor' ? 'Guru BK' : currentRole === 'admin' ? 'Admin' : 'Pengguna';

  setText('profileName', displayName);
  setText('profileEmail', user.email);
  setText('profileRole', roleLabel);
  setText('profileUserId', user.id);
  setText('profileCreatedAt', formatDate(user.created_at));
  setText('profileVerified', user.email_confirmed_at ? 'Terverifikasi' : 'Belum diverifikasi');

  const topName = document.getElementById('topbarUserName');
  const avatar = document.getElementById('topbarAvatar');
  if (topName) topName.textContent = displayName;
  if (avatar) avatar.textContent = String(displayName).trim().charAt(0).toUpperCase() || 'U';

  const schoolRow = document.getElementById('profileSchoolRow');
  const levelRow = document.getElementById('profileLevelRow');
  if (currentRole === 'counselor') {
    const { data, error } = await window.supabaseClient.from('counselor_applications')
      .select('school_name, school_level, full_name')
      .eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
    if (error) console.warn('Data sekolah Guru BK tidak dapat dimuat:', error.message);
    if (data) {
      setText('profileName', data.full_name || displayName);
      setText('profileSchool', data.school_name);
      setText('profileLevel', data.school_level);
      if (schoolRow) schoolRow.hidden = false;
      if (levelRow) levelRow.hidden = false;
    } else {
      if (schoolRow) schoolRow.hidden = true;
      if (levelRow) levelRow.hidden = true;
    }
  } else {
    if (schoolRow) schoolRow.hidden = true;
    if (levelRow) levelRow.hidden = true;
  }
}


function setCounselMessage(message, isError = false) {
  const el = document.getElementById('counselStudentMessage');
  if (el) { el.textContent = message; el.style.color = isError ? '#c0392b' : '#247a4b'; }
}

function formatCounselDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

async function loadCounselingPage() {
  const studentView = document.getElementById('studentCounselView');
  const counselorView = document.getElementById('counselorCounselView');
  const otherView = document.getElementById('otherCounselView');
  if (!studentView || !counselorView || !otherView) return;
  studentView.hidden = currentRole !== 'student';
  counselorView.hidden = currentRole !== 'counselor';
  otherView.hidden = !['student', 'counselor'].includes(currentRole);
  if (currentRole === 'student') {
    const dateInput = document.getElementById('counselDate');
    if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);
    await loadCounselorOptions();
    await loadStudentCounseling();
  } else if (currentRole === 'counselor') {
    await loadCounselorRequests();
  }
}

async function loadCounselorOptions() {
  const select = document.getElementById('counselorSelect');
  if (!select || !currentSession?.user) return;
  select.innerHTML = '<option value="">Memuat Guru BK pendamping...</option>';
  const { data: enrollment, error } = await window.supabaseClient
    .from('cm_student_enrollments')
    .select('counselor_id,class_name')
    .eq('student_id', currentSession.user.id)
    .maybeSingle();
  if (error || !enrollment) {
    select.innerHTML = '<option value="">Belum terhubung dengan Guru BK</option>';
    setCounselMessage(error ? 'Gagal memuat pendamping: ' + formatSupabaseError(error) : 'Akun ini belum memiliki kode kelas yang valid. Hubungi Admin atau Guru BK.', true);
    return;
  }
  const { data: counselor } = await window.supabaseClient.from('profiles').select('*').eq('id', enrollment.counselor_id).maybeSingle();
  const name = counselor?.display_name || counselor?.full_name || counselor?.name || 'Guru BK pendamping';
  select.innerHTML = `<option value="${escapeHtml(enrollment.counselor_id)}">${escapeHtml(name)} — ${escapeHtml(enrollment.class_name)}</option>`;
  select.value = enrollment.counselor_id;
  select.disabled = true;
  setCounselMessage('Kamu hanya dapat berkonsultasi dengan Guru BK yang menaungi rombel ' + enrollment.class_name + '.');
}

const counselForm = document.getElementById('counselRequestForm');
if (counselForm) counselForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (currentRole !== 'student' || !currentSession?.user) {
    setCounselMessage('Silakan login menggunakan akun Siswa untuk mengajukan konseling.', true);
    return;
  }

  const counselorId = document.getElementById('counselorSelect').value;
  const date = document.getElementById('counselDate').value;
  const time = document.getElementById('counselTime').value;
  const topic = document.getElementById('counselTopic').value.trim();
  if (!counselorId || !date || !time || !topic) {
    setCounselMessage('Lengkapi semua data pengajuan.', true);
    return;
  }

  const selectedDate = new Date(`${date}T${time}:00`);
  if (Number.isNaN(selectedDate.getTime())) {
    setCounselMessage('Tanggal atau jam yang dipilih tidak valid.', true);
    return;
  }
  if (selectedDate.getTime() < Date.now()) {
    setCounselMessage('Pilih jadwal yang belum lewat.', true);
    return;
  }

  const button = document.getElementById('submitCounselRequest');
  button.disabled = true;
  setCounselMessage('Mengirim pengajuan...');
  try {
    const selectedName = document.getElementById('counselorSelect').selectedOptions[0]?.textContent || 'Guru BK';
    const { error } = await window.supabaseClient.from('cm_appointments').insert({
      student_id: currentSession.user.id,
      counselor_id: counselorId,
      student_name: currentUserName(),
      counselor_name: selectedName,
      scheduled_at: selectedDate.toISOString(),
      topic,
      status: 'pending'
    });
    if (error) throw error;
    counselForm.reset();
    setCounselMessage('Pengajuan berhasil dikirim. Menunggu konfirmasi Guru BK.');
    await loadStudentCounseling();
  } catch (error) {
    console.error('Gagal mengajukan konseling:', error);
    setCounselMessage('Pengajuan gagal: ' + formatSupabaseError(error), true);
  } finally {
    button.disabled = false;
  }
});

function getConsultationWindow(scheduledAt) {
  const start = new Date(scheduledAt).getTime();
  const now = Date.now();
  const end = start + 30 * 60 * 1000;
  if (!Number.isFinite(start)) return { state: 'invalid', start, end, remaining: 0 };
  if (now < start) return { state: 'upcoming', start, end, remaining: start - now };
  if (now >= end) return { state: 'ended', start, end, remaining: 0 };
  return { state: 'active', start, end, remaining: end - now };
}

function formatRemainingConsultation(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes} menit ${String(rest).padStart(2, '0')} detik`;
}

async function loadStudentCounseling() {
  const box = document.getElementById('studentCounselList');
  if (!box || !currentSession?.user) return;
  box.textContent = 'Memuat jadwal...';
  const { data, error } = await window.supabaseClient.from('cm_appointments')
    .select('id, counselor_id, counselor_name, scheduled_at, topic, status, response_note')
    .eq('student_id', currentSession.user.id).order('scheduled_at', { ascending: false });
  if (error) { console.error('Gagal memuat jadwal siswa:', error); box.textContent = 'Gagal memuat jadwal: ' + formatSupabaseError(error); return; }
  if (!data?.length) { box.textContent = 'Belum ada pengajuan jadwal konseling.'; return; }
  box.innerHTML = data.map(item => `<article class="study-card">
    <h3>${escapeHtml(item.counselor_name || 'Guru BK')}</h3>
    <p><b>Jadwal:</b> ${escapeHtml(formatCounselDate(item.scheduled_at))}</p>
    <p><b>Topik:</b> ${escapeHtml(item.topic)}</p>
    <p><b>Status:</b> ${escapeHtml(item.status)}</p>
    ${item.response_note ? `<p><b>Catatan:</b> ${escapeHtml(item.response_note)}</p>` : ''}
    ${item.status === 'pending' ? `<button class="btn secondary" data-cancel-counsel="${escapeHtml(item.id)}">Batalkan Pengajuan</button>` : ''}
    ${['approved','rescheduled'].includes(item.status) ? (getConsultationWindow(item.scheduled_at).state === 'ended' ? `<button class="btn secondary" data-student-open-chat="${escapeHtml(item.id)}">Lihat Riwayat Chat (Sesi Selesai)</button>` : `<button class="btn primary" data-student-open-chat="${escapeHtml(item.id)}">${getConsultationWindow(item.scheduled_at).state === 'upcoming' ? 'Chat Dibuka Saat Jadwal' : 'Hubungi Guru BK'}</button>`) : ''}
  </article>`).join('');
  box.querySelectorAll('[data-cancel-counsel]').forEach(button => button.addEventListener('click', async () => {
    if (!confirm('Batalkan pengajuan konseling ini?')) return;
    const { error } = await window.supabaseClient.from('cm_appointments')
      .delete().eq('id', button.dataset.cancelCounsel).eq('student_id', currentSession.user.id).eq('status', 'pending');
    if (error) { alert('Pengajuan tidak dapat dibatalkan.'); return; }
    await loadStudentCounseling();
  }));
  box.querySelectorAll('[data-student-open-chat]').forEach(button => {
    button.addEventListener('click', async () => {
      const appointmentId = button.dataset.studentOpenChat;
      const chatPanel = document.getElementById('cmChatPanel');
      if (chatPanel) chatPanel.hidden = false;
      await openCounselChat(appointmentId);
      if (chatPanel) chatPanel.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });
}

async function loadCounselorRequests() {
  const box = document.getElementById('counselorCounselList');
  if (!box || !currentSession?.user) return;
  box.textContent = 'Memuat pengajuan...';
  const { data, error } = await window.supabaseClient.from('cm_appointments')
    .select('id, student_name, scheduled_at, topic, status, response_note')
    .eq('counselor_id', currentSession.user.id).order('scheduled_at', { ascending: true });
  if (error) { console.error('Gagal memuat pengajuan Guru BK:', error); box.textContent = 'Gagal memuat pengajuan: ' + formatSupabaseError(error); return; }
  if (!data?.length) { box.textContent = 'Belum ada pengajuan konseling dari siswa.'; return; }
  box.innerHTML = data.map(item => `<article class="study-card">
    <h3>${escapeHtml(item.student_name || 'Siswa')}</h3>
    <p><b>Jadwal yang diminta:</b> ${escapeHtml(formatCounselDate(item.scheduled_at))}</p>
    <p><b>Topik:</b> ${escapeHtml(item.topic)}</p><p><b>Status:</b> ${escapeHtml(item.status)}</p>
    ${item.status === 'pending' ? `<div class="form-row"><button class="btn primary" data-counsel-action="approved" data-id="${escapeHtml(item.id)}">Setujui</button><button class="btn secondary" data-counsel-action="rejected" data-id="${escapeHtml(item.id)}">Tolak</button></div>
      <label>Atur ulang jadwal<input type="datetime-local" data-reschedule-input="${escapeHtml(item.id)}"></label><button class="btn secondary" data-counsel-action="reschedule" data-id="${escapeHtml(item.id)}">Simpan Jadwal Baru</button>` : ''}
    ${['approved','rescheduled'].includes(item.status) ? (getConsultationWindow(item.scheduled_at).state === 'ended' ? `<button class="btn secondary" data-counsel-open-chat="${escapeHtml(item.id)}">Lihat Riwayat Chat (Sesi Selesai)</button>` : `<button class="btn primary" data-counsel-open-chat="${escapeHtml(item.id)}">${getConsultationWindow(item.scheduled_at).state === 'upcoming' ? 'Chat Dibuka Saat Jadwal' : 'Buka Chat & Beri Feedback'}</button>`) : ''}
    ${item.response_note ? `<p><b>Catatan:</b> ${escapeHtml(item.response_note)}</p>` : ''}
  </article>`).join('');
  box.querySelectorAll('[data-counsel-action]').forEach(button => button.addEventListener('click', async () => {
    const id = button.dataset.id; const action = button.dataset.counselAction;
    let update = {};
    if (action === 'reschedule') {
      const value = box.querySelector(`[data-reschedule-input="${id}"]`)?.value;
      if (!value) { alert('Pilih tanggal dan jam baru.'); return; }
      update = { scheduled_at: new Date(value).toISOString(), status: 'rescheduled', response_note: 'Guru BK mengusulkan jadwal baru.' };
    } else update = { status: action };
    button.disabled = true;
    const { error } = await window.supabaseClient.from('cm_appointments').update(update)
      .eq('id', id).eq('counselor_id', currentSession.user.id).eq('status', 'pending');
    if (error) { console.error('Gagal mengubah jadwal konseling:', error); alert('Perubahan jadwal gagal: ' + formatSupabaseError(error)); }
    await loadCounselorRequests();
  }));
  box.querySelectorAll('[data-counsel-open-chat]').forEach(button => {
    button.addEventListener('click', async () => {
      const appointmentId = button.dataset.counselOpenChat;
      const chatPanel = document.getElementById('cmChatPanel');
      if (chatPanel) chatPanel.hidden = false;
      await openCounselChat(appointmentId);
      if (chatPanel) chatPanel.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });
}

// Profil juga dapat dibuka dari menu; tombol keluar tersedia di halaman profil.
document.getElementById('profileLogoutButton')?.addEventListener('click', async () => {
  const { error } = await window.supabaseClient.auth.signOut();
  if (error) showAuthMessage('Gagal keluar: ' + error.message, true);
});


// ======================================================
// DASHBOARD TERPISAH, CHAT SETELAH JADWAL DISETUJUI,
// DAN FEEDBACK GURU BK
// ======================================================

function setCounselChatMessage(message, isError = false) {
  const el = document.getElementById('cmChatStatus');
  if (el) {
    el.textContent = message;
    el.style.color = isError ? '#b42318' : '#247a4b';
  }
}


async function loadCounselorClassCodes() {
  const box = document.getElementById('counselorClassCodeList');
  if (!box || currentRole !== 'counselor' || !currentSession?.user) return;
  const { data, error } = await window.supabaseClient.from('cm_class_codes')
    .select('id,class_name,code,created_at,active').eq('counselor_id', currentSession.user.id)
    .order('created_at', { ascending: true });
  if (error) { box.textContent = 'Gagal memuat kode: ' + formatSupabaseError(error); return; }
  if (!data?.length) { box.textContent = 'Belum ada kode kelas. Buat kode pertama untuk rombelmu.'; return; }
  box.innerHTML = data.map(row => `<article class="study-card"><h3>${escapeHtml(row.class_name)}</h3><p><b>Kode:</b> <strong>${escapeHtml(row.code)}</strong></p><p><b>Status:</b> ${row.active ? 'Aktif' : 'Nonaktif'}</p><button class="btn secondary" type="button" data-copy-class-code="${escapeHtml(row.code)}">Salin kode</button></article>`).join('');
  box.querySelectorAll('[data-copy-class-code]').forEach(btn => btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(btn.dataset.copyClassCode); alert('Kode berhasil disalin.'); }
    catch { alert('Kode: ' + btn.dataset.copyClassCode); }
  }));
}
async function loadCounselorStudents() {
  const box = document.getElementById('counselorStudentList');
  if (!box || currentRole !== 'counselor' || !currentSession?.user) return;
  const { data, error } = await window.supabaseClient.from('cm_student_enrollments')
    .select('student_id,student_name,class_name,created_at').eq('counselor_id', currentSession.user.id)
    .order('class_name', { ascending: true });
  if (error) { box.textContent = 'Gagal memuat siswa: ' + formatSupabaseError(error); return; }
  if (!data?.length) { box.textContent = 'Belum ada siswa yang menggunakan kode kelasmu.'; return; }
  const ids = data.map(x => x.student_id);
  const { data: profiles } = await window.supabaseClient.from('profiles').select('*').in('id', ids);
  const byId = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  box.innerHTML = data.map(row => {
    const p = byId[row.student_id] || {};
    const studentName = row.student_name || p.display_name || p.full_name || 'Nama belum tersedia';
    const approvalStatus = String(p.approval_status || 'pending').toLowerCase();
    const accountStatus = approvalStatus === 'approved' ? 'Aktif' :
      approvalStatus === 'rejected' ? 'Ditolak' : 'Menunggu persetujuan';
    return `<article class="study-card"><h3>${escapeHtml(studentName)}</h3><p><b>Rombel:</b> ${escapeHtml(row.class_name)}</p><p><b>Status akun:</b> <strong>${escapeHtml(accountStatus)}</strong></p></article>`;
  }).join('');
}
document.getElementById('createClassCode')?.addEventListener('click', async () => {
  const input = document.getElementById('newClassName');
  const message = document.getElementById('classCodeMessage');
  const className = input?.value.trim();
  if (!className) { if (message) message.textContent = 'Isi nama rombel terlebih dahulu.'; return; }
  const { data, error } = await window.supabaseClient.rpc('cm_create_class_code', { p_class_name: className });
  if (error) { if (message) message.textContent = 'Gagal membuat kode: ' + formatSupabaseError(error); return; }
  if (message) message.textContent = 'Kode berhasil dibuat: ' + data + '. Bagikan kode ini kepada siswa rombel tersebut.';
  if (input) input.value = '';
  await loadCounselorClassCodes();
});
document.getElementById('refreshClassCodes')?.addEventListener('click', loadCounselorClassCodes);

async function loadCounselorDashboard() {
  if (currentRole !== 'counselor' || !currentSession?.user) return;
  const id = currentSession.user.id;
  const { data, error } = await window.supabaseClient
    .from('cm_appointments')
    .select('id,student_name,scheduled_at,topic,status,response_note')
    .eq('counselor_id', id)
    .order('scheduled_at', { ascending: true });

  const box = document.getElementById('counselorDashboardAppointments');
  if (!box) return;
  if (error) {
    box.textContent = 'Tidak dapat memuat jadwal: ' + formatSupabaseError(error);
    return;
  }
  if (!data?.length) {
    box.textContent = 'Belum ada pengajuan jadwal dari siswa.';
    return;
  }

  box.innerHTML = data.map(a => `
    <article class="study-card">
      <h3>${escapeHtml(a.student_name || 'Siswa')}</h3>
      <p><b>Jadwal:</b> ${escapeHtml(formatCounselDate(a.scheduled_at))}</p>
      <p><b>Topik:</b> ${escapeHtml(a.topic || '-')}</p>
      <p><b>Status:</b> ${escapeHtml(a.status)}</p>
      ${a.response_note ? `<p><b>Catatan:</b> ${escapeHtml(a.response_note)}</p>` : ''}
      ${a.status === 'pending' ? `
        <div class="form-row">
          <button class="btn primary" data-cm-approve="${escapeHtml(a.id)}">Setujui</button>
          <button class="btn secondary" data-cm-reject="${escapeHtml(a.id)}">Tolak</button>
        </div>` : ''}
      ${['approved','rescheduled'].includes(a.status) ? (getConsultationWindow(a.scheduled_at).state === 'ended' ? `
        <button class="btn secondary" data-cm-open-chat="${escapeHtml(a.id)}">Lihat Riwayat Chat (Sesi Selesai)</button>` : `
        <button class="btn primary" data-cm-open-chat="${escapeHtml(a.id)}">${getConsultationWindow(a.scheduled_at).state === 'upcoming' ? 'Chat Dibuka Saat Jadwal' : 'Buka Chat & Beri Feedback'}</button>`) : ''}
    </article>`).join('');

  box.querySelectorAll('[data-cm-approve],[data-cm-reject]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.cmApprove || btn.dataset.cmReject;
      const status = btn.dataset.cmApprove ? 'approved' : 'rejected';
      btn.disabled = true;
      const { error } = await window.supabaseClient.from('cm_appointments')
        .update({status, response_note: status === 'approved' ? 'Jadwal disetujui Guru BK.' : 'Pengajuan belum dapat disetujui.'})
        .eq('id', id).eq('counselor_id', currentSession.user.id).eq('status', 'pending');
      if (error) alert('Gagal mengubah jadwal: ' + formatSupabaseError(error));
      await loadCounselorDashboard();
    });
  });
  box.querySelectorAll('[data-cm-open-chat]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const appointmentId = btn.dataset.cmOpenChat;
      showPage('counsel');
      // Tunggu halaman konseling selesai dimuat agar panel chat tidak
      // langsung disembunyikan kembali oleh loadCounselingPage().
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await openCounselChat(appointmentId);
    });
  });
}

let activeCounselAppointmentId = null;
let activeCounselAppointment = null;
let counselChatClock = null;

function updateCounselChatWindowUI() {
  const input = document.getElementById('cmChatInput');
  const send = document.getElementById('cmChatSend');
  const status = document.getElementById('cmChatStatus');
  const form = document.getElementById('cmChatForm');
  if (!activeCounselAppointment) return;
  const windowState = getConsultationWindow(activeCounselAppointment.scheduled_at);
  const canSend = ['approved','rescheduled'].includes(activeCounselAppointment.status) && windowState.state === 'active';
  if (input) input.disabled = !canSend;
  if (send) send.disabled = !canSend;
  if (form) form.style.opacity = canSend ? '1' : '.65';
  if (!status) return;
  if (windowState.state === 'upcoming') {
    status.textContent = 'Sesi konsultasi berlangsung 30 menit. Chat akan terbuka pada waktu jadwal: ' + formatCounselDate(activeCounselAppointment.scheduled_at) + '.';
  } else if (windowState.state === 'active') {
    status.textContent = 'Chat sedang dibuka. Sisa waktu konsultasi: ' + formatRemainingConsultation(windowState.remaining) + '.';
  } else if (windowState.state === 'ended') {
    status.textContent = 'Waktu konsultasi 30 menit telah habis. Pengiriman pesan ditutup. Riwayat chat tetap dapat dibaca.';
  } else {
    status.textContent = 'Waktu jadwal tidak valid. Pengiriman pesan dinonaktifkan.';
  }
}

async function openCounselChat(appointmentId) {
  activeCounselAppointmentId = appointmentId;
  const chatPanel = document.getElementById('cmChatPanel');
  if (chatPanel) chatPanel.hidden = false;
  if (counselChatClock) clearInterval(counselChatClock);
  const { data: appointment, error: apptError } = await window.supabaseClient
    .from('cm_appointments').select('id,status,student_id,counselor_id,scheduled_at')
    .eq('id', appointmentId).single();
  if (apptError || !appointment) {
    setCounselChatMessage('Jadwal tidak ditemukan atau kamu tidak memiliki akses.', true);
    return;
  }
  if (!['approved','rescheduled'].includes(appointment.status)) {
    setCounselChatMessage('Chat hanya tersedia setelah jadwal disetujui Guru BK.', true);
    return;
  }
  activeCounselAppointment = appointment;
  updateCounselChatWindowUI();
  counselChatClock = setInterval(updateCounselChatWindowUI, 1000);
  await loadCounselMessages();
  await loadCounselFeedback();
}

async function loadCounselMessages() {
  const box = document.getElementById('cmChatMessages');
  if (!box || !activeCounselAppointmentId) return;
  const { data, error } = await window.supabaseClient.from('cm_messages')
    .select('id,sender_id,message,created_at')
    .eq('appointment_id', activeCounselAppointmentId)
    .order('created_at', {ascending:true});
  if (error) {
    box.textContent = 'Chat gagal dimuat: ' + formatSupabaseError(error);
    return;
  }
  if (!data?.length) {
    box.innerHTML = '<p>Belum ada pesan. Silakan mulai percakapan.</p>';
    return;
  }
  box.innerHTML = data.map(m => `
    <div class="profile-data-card" style="margin:8px 0;max-width:85%;${m.sender_id === currentSession.user.id ? 'margin-left:auto;background:#eef5ff;' : ''}">
      <small>${m.sender_id === currentSession.user.id ? 'Kamu' : 'Teman konsultasi'} · ${escapeHtml(formatCounselDate(m.created_at))}</small>
      <div style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(m.message)}</div>
    </div>`).join('');
  box.scrollTop = box.scrollHeight;
}

async function loadCounselFeedback() {
  const box = document.getElementById('cmFeedbackDisplay');
  if (!box || !activeCounselAppointmentId) return;
  const { data, error } = await window.supabaseClient.from('cm_feedback')
    .select('feedback_text,created_at')
    .eq('appointment_id', activeCounselAppointmentId)
    .maybeSingle();
  if (error) {
    box.textContent = 'Feedback belum dapat dimuat.';
    return;
  }
  box.textContent = data?.feedback_text
    ? 'Feedback Guru BK: ' + data.feedback_text
    : 'Belum ada feedback dari Guru BK.';
}

document.getElementById('cmChatForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const input = document.getElementById('cmChatInput');
  const message = input?.value.trim();
  if (!message || !activeCounselAppointmentId || !currentSession?.user) return;
  if (!activeCounselAppointment || getConsultationWindow(activeCounselAppointment.scheduled_at).state !== 'active') {
    updateCounselChatWindowUI();
    setCounselChatMessage('Waktu konsultasi 30 menit belum dimulai atau sudah berakhir. Pesan tidak dapat dikirim.', true);
    return;
  }
  const send = document.getElementById('cmChatSend');
  send.disabled = true;
  const { error } = await window.supabaseClient.from('cm_messages').insert({
    appointment_id: activeCounselAppointmentId,
    sender_id: currentSession.user.id,
    message
  });
  updateCounselChatWindowUI();
  if (error) {
    setCounselChatMessage('Pesan gagal dikirim: ' + formatSupabaseError(error), true);
    return;
  }
  input.value = '';
  setCounselChatMessage('Pesan terkirim.');
  await loadCounselMessages();
});

document.getElementById('cmFeedbackForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  if (currentRole !== 'counselor' || !activeCounselAppointmentId) return;
  const input = document.getElementById('cmFeedbackInput');
  const feedback = input?.value.trim();
  if (!feedback) return;
  const { error } = await window.supabaseClient.from('cm_feedback').upsert({
    appointment_id: activeCounselAppointmentId,
    counselor_id: currentSession.user.id,
    feedback_text: feedback,
    updated_at: new Date().toISOString()
  }, {onConflict:'appointment_id'});
  if (error) {
    setCounselChatMessage('Feedback gagal disimpan: ' + formatSupabaseError(error), true);
    return;
  }
  setCounselChatMessage('Feedback berhasil disimpan.');
  await loadCounselFeedback();
});

const oldLoadCounselingPage = loadCounselingPage;
loadCounselingPage = async function() {
  await oldLoadCounselingPage();
  const chatPanel = document.getElementById('cmChatPanel');
  if (chatPanel) chatPanel.hidden = true;
  if (counselChatClock) clearInterval(counselChatClock);
  counselChatClock = null;
  activeCounselAppointmentId = null;
  activeCounselAppointment = null;
  if (currentRole === 'counselor') await loadCounselorDashboard();
  if (currentRole === 'student') await loadStudentChatOptions();
};

async function loadStudentChatOptions() {
  const box = document.getElementById('studentApprovedChatList');
  if (!box || !currentSession?.user) return;
  const { data, error } = await window.supabaseClient.from('cm_appointments')
    .select('id,counselor_name,scheduled_at,topic,status')
    .eq('student_id', currentSession.user.id)
    .in('status',['approved','rescheduled'])
    .order('scheduled_at',{ascending:false});
  if (error) {
    box.textContent = 'Tidak dapat memuat konsultasi: ' + formatSupabaseError(error);
    return;
  }
  if (!data?.length) {
    box.textContent = 'Chat akan muncul setelah Guru BK menyetujui jadwalmu.';
    return;
  }
  box.innerHTML = data.map(a => `
    <article class="study-card">
      <h3>${escapeHtml(a.counselor_name || 'Guru BK')}</h3>
      <p>${escapeHtml(formatCounselDate(a.scheduled_at))}</p>
      <p>${escapeHtml(a.topic || '')}</p>
      <button class="btn ${getConsultationWindow(a.scheduled_at).state === 'active' ? 'primary' : 'secondary'}" data-student-chat="${escapeHtml(a.id)}">${getConsultationWindow(a.scheduled_at).state === 'ended' ? 'Lihat Riwayat Chat (Sesi Selesai)' : getConsultationWindow(a.scheduled_at).state === 'upcoming' ? 'Chat Dibuka Saat Jadwal' : 'Hubungi Guru BK'}</button>
    </article>`).join('');
  box.querySelectorAll('[data-student-chat]').forEach(btn => {
    btn.addEventListener('click', () => openCounselChat(btn.dataset.studentChat));
  });
}

// Dashboard Guru BK bisa dimuat ulang dari tombol dashboard.
document.getElementById('refreshCounselorDashboard')?.addEventListener('click', loadCounselorDashboard);

// Atur menu berdasarkan role akun yang sedang aktif.
const _originalLoadCurrentRole = loadCurrentRole;
loadCurrentRole = async function(session) {
  await _originalLoadCurrentRole(session);
  if (session?.user?.id && currentRole) await cmStartNotificationService(session);
  else cmStopNotificationService();
  const isStudent = currentRole === 'student';
  const isCounselor = currentRole === 'counselor';
  const studentNav = document.getElementById('studentHomeNav');
  const counselorNav = document.getElementById('counselorHomeNav');
  if (studentNav) studentNav.hidden = !isStudent;
  if (counselorNav) counselorNav.hidden = !isCounselor;

  document.querySelectorAll('#mainNav [data-page]').forEach(item => {
    const page = item.dataset.page;
    if (['reflection','map','careers','study','plan'].includes(page)) item.hidden = !isStudent;
    if (page === 'counsel') item.hidden = !['student','counselor'].includes(currentRole);
  });
  const studentApproved = document.getElementById('studentApprovedChatSection');
  if (studentApproved) studentApproved.hidden = !isStudent;
  const feedbackArea = document.getElementById('counselorFeedbackArea');
  if (feedbackArea) feedbackArea.hidden = !isCounselor;
};
// ======================================================
// NOTIFIKASI TERPADU CAREER MAP (Admin, Guru BK, Siswa)
// ======================================================
let cmNotificationChannel = null;
let cmNotificationTimer = null;
let cmNotificationUserId = null;
let cmNotificationIds = new Set();
let cmNotificationUiReady = false;

function cmNotificationTime(value) {
  try { return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); }
  catch (_) { return ''; }
}

function cmEnsureNotificationUI() {
  if (cmNotificationUiReady) return;
  cmNotificationUiReady = true;
  const wrap = document.getElementById('cmNotifWrap');
  if (!wrap) return;
  const toggle = document.getElementById('cmNotifToggle');
  const panel = document.getElementById('cmNotifPanel');
  toggle?.addEventListener('click', async () => {
    const open = !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) await cmLoadNotifications();
  });
  document.getElementById('cmNotifReadAll')?.addEventListener('click', async () => {
    if (!cmNotificationUserId) return;
    const { error } = await window.supabaseClient.from('cm_notifications')
      .update({ is_read: true }).eq('user_id', cmNotificationUserId).eq('is_read', false);
    if (error) console.error('Gagal menandai notifikasi:', error);
    await cmLoadNotifications();
  });
  document.getElementById('cmNotifList')?.addEventListener('click', async event => {
    const item = event.target.closest('[data-notification-id]');
    if (!item) return;
    const id = item.dataset.notificationId;
    const page = item.dataset.notificationPage || 'home';
    await window.supabaseClient.from('cm_notifications').update({ is_read: true }).eq('id', id);
    document.getElementById('cmNotifPanel')?.classList.remove('open');
    document.getElementById('cmNotifToggle')?.setAttribute('aria-expanded','false');
    if (page === 'counselorDashboard' && currentRole === 'counselor') showPage('counselorDashboard');
    else if (page === 'admin' && currentRole === 'admin') showPage('admin');
    else if (page === 'counsel' && ['student','counselor'].includes(currentRole)) showPage('counsel');
    else if (page === 'account') showPage('profile');
    else showPage(currentRole === 'counselor' ? 'counselorDashboard' : currentRole === 'admin' ? 'admin' : 'home');
    await cmLoadNotifications();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('#cmNotifWrap')) {
      panel?.classList.remove('open');
      toggle?.setAttribute('aria-expanded','false');
    }
  });
}

async function cmLoadNotifications() {
  if (!cmNotificationUserId) return;
  const list = document.getElementById('cmNotifList');
  const badge = document.getElementById('cmNotifBadge');
  const { data, error } = await window.supabaseClient.from('cm_notifications')
    .select('id,notification_type,title,body,target_page,is_read,created_at')
    .eq('user_id', cmNotificationUserId)
    .order('created_at', { ascending: false }).limit(40);
  if (error) {
    console.error('Gagal memuat notifikasi:', error);
    if (list) list.innerHTML = '<div class="cm-notif-empty">Notifikasi belum dapat dimuat. Periksa SQL notifikasi.</div>';
    return;
  }
  const unread = (data || []).filter(n => !n.is_read).length;
  if (badge) {
    badge.hidden = unread === 0;
    badge.textContent = unread > 99 ? '99+' : String(unread);
  }
  if (!list) return;
  if (!data?.length) {
    list.innerHTML = '<div class="cm-notif-empty">Belum ada notifikasi.</div>';
    return;
  }
  list.innerHTML = data.map(n => `<button type="button" class="cm-notif-item ${n.is_read ? '' : 'unread'}" data-notification-id="${escapeHtml(n.id)}" data-notification-page="${escapeHtml(n.target_page || 'home')}"><strong>${escapeHtml(n.title)}</strong><span>${escapeHtml(n.body)}</span><small>${escapeHtml(cmNotificationTime(n.created_at))}</small></button>`).join('');
}

function cmStopNotificationService() {
  if (cmNotificationChannel) window.supabaseClient.removeChannel(cmNotificationChannel);
  cmNotificationChannel = null;
  if (cmNotificationTimer) clearInterval(cmNotificationTimer);
  cmNotificationTimer = null;
  cmNotificationUserId = null;
  cmNotificationIds = new Set();
  const badge = document.getElementById('cmNotifBadge');
  if (badge) badge.hidden = true;
}

async function cmStartNotificationService(session) {
  const userId = session?.user?.id;
  if (!userId) { cmStopNotificationService(); return; }
  if (cmNotificationUserId === userId) return;
  cmStopNotificationService();
  cmNotificationUserId = userId;
  cmEnsureNotificationUI();
  await cmLoadNotifications();
  cmNotificationChannel = window.supabaseClient.channel('cm-notifications-' + userId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cm_notifications', filter: 'user_id=eq.' + userId }, payload => {
      const n = payload.new;
      if (n?.id && !cmNotificationIds.has(n.id)) {
        cmNotificationIds.add(n.id);
        // Toast kecil saat pengguna sedang membuka aplikasi.
        const toast = document.createElement('div');
        toast.textContent = (n.title || 'Notifikasi') + ': ' + (n.body || '');
        toast.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:3000;max-width:min(360px,calc(100vw - 36px));padding:13px 16px;border-radius:12px;background:#18345c;color:white;box-shadow:0 8px 25px #0002;font:13px/1.45 sans-serif';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5500);
      }
      cmLoadNotifications();
    }).subscribe();
  // Polling cadangan jika Realtime belum aktif/tersedia.
  cmNotificationTimer = setInterval(cmLoadNotifications, 30000);
}

cmEnsureNotificationUI();
