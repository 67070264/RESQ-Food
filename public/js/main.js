// ===== ข้อมูลพื้นฐานสำหรับ UI =====
const TABS = [
  { id: "all",     label: "ทั้งหมด" },
  { id: "meal",    label: "ข้าวกล่อง" },
  { id: "bakery",  label: "เบเกอรี่" },
  { id: "dessert", label: "ขนมหวาน" }
];

const FAQS = [
  { q: "ชุดอาหารสุ่มคืออะไร", a: "ร้านจัดอาหารที่เหลือจากการขายเป็นชุด คุณจะรู้ประเภทและราคาก่อนจอง แต่เมนูจริงอาจต่างกันในแต่ละวัน" },
  { q: "ยกเลิกการจองได้ไหม", a: "สามารถติดต่อร้านค้าเพื่อยกเลิกการจองล่วงหน้าอย่างน้อย 1 ชั่วโมงก่อนเวลารับอาหาร" },
  { q: "อาหารในชุดปลอดภัยหรือไม่", a: "อาหารในชุดคือของที่ร้านพร้อมขายแต่เหลือจากการขายประจำวัน ตรวจวันและเวลาที่ระบุบนชุดก่อนรับทุกครั้ง" },
  { q: "ร้านค้าต้องเสียค่าใช้จ่ายอะไรบ้าง", a: "ร้านค้าสามารถลงรายการอาหารส่วนเกินและจัดการออเดอร์ผ่านระบบ ResQ-Food ได้ฟรี ไม่มีค่าธรรมเนียมแรกเข้า" }
];

const BAG_ICON = `
  <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
    <path d="M14 24h36l-3 30a4 4 0 0 1-4 3.5H21a4 4 0 0 1-4-3.5z" fill="#fff" stroke="#12233F" stroke-width="3" stroke-linejoin="round"/>
    <path d="M22 24v-3a10 10 0 0 1 20 0v3" fill="none" stroke="#12233F" stroke-width="3" stroke-linecap="round"/>
  </svg>`;

const TINTS = ["var(--peach)", "var(--mint)", "var(--butter)", "var(--sky)"];

// ===== State =====
const state = { tab: "all", faq: 0, offers: [] };

// ===== Elements =====
const tabsEl = document.getElementById("tabs");
const offersEl = document.getElementById("offers-list");
const faqEl = document.getElementById("faq-list");
const searchForm = document.getElementById("searchForm");
const kindSelect = document.getElementById("kind");

// ===== 1. ดึงข้อมูลอาหารจริงจาก Backend API =====
async function fetchFoods() {
  try {
    const res = await fetch('/api/v1/foods');
    const foods = await res.json();
    
    // แปลงข้อมูลจาก MongoDB ให้เข้ากับการ์ดดีไซน์ใหม่
    state.offers = foods.map((f, index) => ({
      id: f._id,
      cat: f.category || "all", // กรณีใน DB ยังไม่มีฟิลด์ category จะแสดงในแท็บ "ทั้งหมด"
      shop: f.businessId ? f.businessId.name : "ร้านค้าพาร์ทเนอร์",
      item: f.title,
      desc: f.description || "อาหารส่วนเกินคุณภาพดีพร้อมรับ",
      expiredAt: f.expiredAt ? new Date(f.expiredAt).toLocaleDateString('th-TH') : "วันนี้",
      left: f.quantity,
      now: f.discountPrice,
      was: f.originalPrice,
      image: f.image,
      tint: TINTS[index % TINTS.length]
    }));

    renderOffers();
  } catch (err) {
    offersEl.innerHTML = `<p class="muted">ไม่สามารถโหลดรายการอาหารได้ในขณะนี้</p>`;
  }
}

// ===== 2. ฟังก์ชันกดจอง / สั่งซื้ออาหารจริง (ยิง POST /api/v1/orders) =====
async function bookFood(foodId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนทำการจองอาหาร');
    window.location.href = '/login';
    return;
  }

  try {
    const res = await fetch('/api/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        foodId: foodId,
        type: 'Purchase',
        quantity: 1
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert('🎉 จองอาหารสำเร็จแล้ว! สามารถตรวจสอบประวัติการจองได้ในระบบ');
      fetchFoods(); // โหลดข้อมูลใหม่เพื่ออัปเดตจำนวนคงเหลือทันที
    } else {
      alert(data.message || 'ไม่สามารถจองได้ (ตรวจสอบว่าเข้าสู่ระบบด้วยสิทธิ์ Customer หรือ Foundation)');
    }
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
  }
}

// ===== Tabs =====
function renderTabs() {
  tabsEl.innerHTML = "";
  TABS.forEach((t) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab";
    btn.textContent = t.label;
    btn.setAttribute("aria-pressed", String(state.tab === t.id));
    btn.addEventListener("click", () => setTab(t.id));
    tabsEl.appendChild(btn);
  });
}

function setTab(id) {
  state.tab = id;
  kindSelect.value = id;
  renderTabs();
  renderOffers();
}

// ===== Offers =====
function renderOffers() {
  const list = state.offers.filter((o) => state.tab === "all" || o.cat === state.tab);
  
  if (list.length === 0) {
    offersEl.innerHTML = `<p class="muted">ยังไม่มีรายการอาหารเหลือในหมวดหมู่นี้</p>`;
    return;
  }

  offersEl.innerHTML = list.map((o) => `
    <article class="offer">
      <div class="offer__img" style="background:${o.tint}; overflow:hidden;">
        ${o.image 
          ? `<img src="${o.image}" alt="${o.item}" style="width:100%; height:100%; object-fit:cover;">` 
          : BAG_ICON}
      </div>
      <div class="offer__body">
        <div class="muted">${o.shop}</div>
        <h3 class="offer__title">${o.item}</h3>
        <div class="offer__meta">หมดอายุ: ${o.expiredAt} · เหลือ ${o.left} ชุด</div>
        <div class="offer__foot">
          <div class="price"><span class="price__now">฿${o.now}</span><span class="price__was">฿${o.was}</span></div>
          <button type="button" class="btn btn--dark" onclick="bookFood('${o.id}')">จอง</button>
        </div>
      </div>
    </article>`).join("");
}

// ===== FAQ =====
function renderFaq() {
  faqEl.innerHTML = "";
  FAQS.forEach((f, i) => {
    const open = state.faq === i;
    const item = document.createElement("div");
    item.className = "faq__item";
    item.innerHTML = `
      <button type="button" class="faq__q" aria-expanded="${open}" aria-controls="faq-a-${i}">
        <span>${f.q}</span>
        <span class="faq__sign" aria-hidden="true">${open ? "−" : "+"}</span>
      </button>
      <p class="faq__a" id="faq-a-${i}" ${open ? "" : "hidden"}>${f.a}</p>`;
    item.querySelector("button").addEventListener("click", () => {
      state.faq = open ? -1 : i;
      renderFaq();
    });
    faqEl.appendChild(item);
  });
}

// ===== Search form =====
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  setTab(kindSelect.value);
  document.getElementById("offers").scrollIntoView({ behavior: "smooth" });
});

// ===== จัดการแถบเมนูตามสถานะ Login =====
function checkAuthUI() {
  const token = localStorage.getItem('token');
  const authNav = document.getElementById('authNav');
  if (token && authNav) {
    authNav.innerHTML = `
      <a href="/add-food" class="btn btn--accent" style="min-height:40px; padding:0 18px;">+ ลงขายอาหาร</a>
      <button type="button" onclick="logout()" class="btn btn--dark" style="min-height:40px; padding:0 18px;">ออกจากระบบ</button>
    `;
  }
}

function logout() {
  localStorage.removeItem('token');
  alert('ออกจากระบบเรียบร้อย');
  window.location.reload();
}

// ===== Init =====
checkAuthUI();
renderTabs();
fetchFoods();
renderFaq();