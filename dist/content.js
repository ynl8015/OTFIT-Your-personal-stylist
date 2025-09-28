let isSelecting = false;
let overlay = null;

// ✅ 팝업에서 버튼 클릭 시 상품 선택 모드 토글
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleSelect") {
    isSelecting = !isSelecting;
    console.log(`🟢 상품 선택 모드: ${isSelecting ? "활성화" : "비활성화"}`);
    if (isSelecting) {
      createOverlay();
      addClickListener();
    } else {
      removeOverlay();
      removeClickListener();
    }
  } else if (request.action === "selectionComplete") {
    // 상품 선택 완료 시 상품 선택 모드 종료
    isSelecting = false;
    removeOverlay();
    removeClickListener();
    console.log("🛑 상품 선택 완료로 모드 종료");
  }
});

// 쇼핑몰 페이지에 "가상 착용" 버튼 추가
window.onload = function () {
  const productContainer = document.querySelector(".product-detail");
  if (!productContainer) return;

  const tryOnButton = document.createElement("button");
  tryOnButton.innerText = "👗 가상 착용";
  tryOnButton.style.cssText =
    "position: absolute; top: 10px; right: 10px; background: #ff4081; color: white; padding: 8px; border-radius: 5px; cursor: pointer;";
  productContainer.appendChild(tryOnButton);

  tryOnButton.addEventListener("click", () => {
    const productName =
      document.querySelector(".product-title")?.innerText || "Unknown";
    const productImage =
      document.querySelector(".product-image img")?.src || "";
    const productPrice =
      document.querySelector(".product-price")?.innerText || "Unknown";
    const productCategory = classifyCategory(productName); // 카테고리 자동 판별

    if (productImage) {
      chrome.runtime.sendMessage({
        action: "tryOn",
        product: {
          name: productName,
          image: productImage,
          price: productPrice,
          category: productCategory,
        },
      });
    } else {
      alert("상품 이미지를 찾을 수 없습니다.");
    }
  });
};

// ✅ 상품 선택 시 화면 오버레이 효과 추가
function createOverlay() {
  overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
  overlay.style.zIndex = "10000";
  overlay.style.pointerEvents = "none";
  document.body.appendChild(overlay);
}

// ✅ 상품 선택 종료 시 오버레이 제거
function removeOverlay() {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
}

// ✅ 이벤트 리스너 추가
function addClickListener() {
  console.log("🖱 상품 클릭 이벤트 추가됨!");
  document.addEventListener("click", handleClick, true);
  document.addEventListener("mouseover", handleMouseOver, true);
  document.addEventListener("mouseout", handleMouseOut, true);
}

// ✅ 이벤트 리스너 제거
function removeClickListener() {
  console.log("🛑 상품 클릭 이벤트 제거됨!");
  document.removeEventListener("click", handleClick, true);
  document.removeEventListener("mouseover", handleMouseOver, true);
  document.removeEventListener("mouseout", handleMouseOut, true);
}

// ✅ 마우스 오버 이벤트 처리
function handleMouseOver(e) {
  if (!isSelecting) return;

  const productElement = findProductElement(e.target);
  if (productElement) {
    productElement.style.outline = "2px solid #ff5500";
    e.preventDefault();
    e.stopPropagation();
  }
}

// ✅ 마우스 아웃 이벤트 처리
function handleMouseOut(e) {
  if (!isSelecting) return;

  const productElement = findProductElement(e.target);
  if (productElement) {
    productElement.style.outline = "";
  }
}

// ✅ 상품 요소를 찾는 함수
function findProductElement(element) {
  let current = element;
  let depth = 0;
  const maxDepth = 10;

  while (current && current !== document.body && depth < maxDepth) {
    depth++;

    if (current.classList && current.classList.contains("god-item")) {
      return current;
    }

    if (
      current.querySelector &&
      current.querySelector(".caption") &&
      current.querySelector("img")
    ) {
      return current;
    }

    if (
      current.classList &&
      (current.classList.contains("cunit_t232") ||
        current.classList.contains("cunit_t") ||
        current.classList.contains("item"))
    ) {
      return current;
    }

    const hasImg = current.querySelector && current.querySelector("img");
    const hasPrice =
      current.textContent &&
      (current.textContent.includes("원") ||
        current.textContent.match(/\d{3,6}원/));

    if (hasImg && hasPrice && current.children && current.children.length > 1) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

// ✅ 상품 클릭 시 데이터 추출 후 background.js로 전송
function handleClick(e) {
  if (!isSelecting) return;

  console.log("🖱 상품 클릭 감지됨!", e.target);

  const productElement = findProductElement(e.target);
  if (productElement) {
    const productInfo = extractProductInfo(productElement);
    if (productInfo) {
      // 액션 이름을 tryOn으로 변경
      chrome.runtime.sendMessage({
        action: "tryOn",
        product: productInfo,
      });

      showFeedback(productElement, "✓ 상품이 선택되었습니다");
    }

    e.preventDefault();
    e.stopPropagation();
  }
}

// ✅ SSF 상품 정보 추출 함수
function extractProductInfoSSF(productElement) {
  // 기본 이미지 추출
  const img = productElement.querySelector("img");
  let imgSrc = img ? img.src || img.getAttribute("data-src") || "" : "";

  let productName =
    productElement
      .querySelector(".name, .title, .prd_name")
      ?.textContent?.trim() || "Unknown";
      
  if (productName === "Unknown") {
    // 전체 DOM에서 상품명 찾기
    const productTitle = document.querySelector(".gods-name#goodDtlTitle");
    if (productTitle) {
      productName = productTitle.textContent.trim();
    }
  }
  // 브랜드 추출 로직 수정
  let brand = productElement.querySelector(".brand")?.textContent?.trim() || "Unknown";
  
  if (brand === "Unknown") {
    // 전체 DOM에서 브랜드 로고 찾기
    const brandLogos = document.querySelectorAll("#brandLogo");
    if (brandLogos.length > 0) {
      // 첫 번째로 발견된 브랜드 로고의 텍스트 사용
      const firstBrandLogo = brandLogos[0];
      if (firstBrandLogo.textContent) {
        brand = firstBrandLogo.textContent.trim();
      } else if (firstBrandLogo.getAttribute('alt')) {
        // 텍스트가 없다면 alt 속성 확인
        brand = firstBrandLogo.getAttribute('alt').trim();
      }
    }
  }

  // 가격 추출 로직
  let price = "0";
  const priceElement = productElement.querySelector(".price, .prc, .amount");
  if (priceElement) {
    const priceText = priceElement.textContent;
    const match = priceText.match(/판매가\s*([0-9,]+)/);
    if (match) {
      price = match[1] + "원";
    } else {
      const numMatch = priceText.match(/([0-9,]+)원/);
      if (numMatch) {
        price = numMatch[1] + "원";
      }
    }
  }

  // 가격이 0원이면 전체 DOM에서 찾기 및 큰 이미지로 변경
  if (price === "0" || price === "0원") {
    const detailPrice = document.querySelector(".gods-price, .price");
    if (detailPrice) {
      const priceText = detailPrice.textContent;
      const match = priceText.match(/판매가\s*([0-9,]+)/);
      if (match) {
        price = match[1] + "원";
        // 가격을 찾았을 때 큰 이미지로 변경
        const detailImg = document.querySelector(".preview-img .img-item.active img");
        if (detailImg) {
          imgSrc = detailImg.src || detailImg.getAttribute("data-src") || "";
        }
        // 브랜드명도 그때 바꿔서 가져오기
        brand = document.querySelector("h2.brand-name a")?.textContent?.trim() || "Unknown";
      }
    }
  }
  

  if (productName === "Unknown") {
    // 전체 DOM에서 상품명 찾기
    const productTitle = document.querySelector(".gods-name#goodDtlTitle");
    if (productTitle) {
      productName = productTitle.textContent.trim();
    }
  }

  return {
    name: productName,
    image: imgSrc,
    price: price,
    category: classifyCategory(productName),
    brand: brand,
  };
}

// ✅ 무신사 상품 정보 추출 함수
function extractProductInfoMusinsa(productElement) {
  // 기본 이미지 추출
  const img = productElement.querySelector("img");
  let imgSrc = img ? img.src || img.getAttribute("data-src") || "" : "";

  // 브랜드명 추출
  let brand = productElement.querySelector(".text-etc_11px_semibold.line-clamp-1")?.textContent?.trim() || "Unknown";

  // 상품명 추출 (이미지 alt에서 브랜드명 제거)
  let productName = img?.getAttribute("alt") || "Unknown";
  
  if (brand !== "Unknown" && productName.startsWith(brand)) {
    productName = productName.slice(brand.length).trim();
  } else if (brand === "Unknown") {
    // 브랜드명이 Unknown일 때 대체 로직
    const brandMatch = productName.match(/^([\u3131-\u314E\u314F-\u3163\uAC00-\uD7A3\s]+\([A-Z\s]+\))/);
    if (brandMatch) {
      brand = brandMatch[1];
      productName = productName.replace(brand, '').trim();
    }
  }

  // 가격 추출 (a 태그의 data-price 속성)
  let price = "0";
  const priceElement = productElement.querySelector("a[data-price]");
  if (priceElement) {
    price = priceElement.getAttribute("data-price") + "원";
  }

  return {
    name: productName,
    image: imgSrc,
    price: price,
    category: classifyCategory(productName),
    brand: brand,
  };
}

// 29cm용 상품 정보 추출 함수
function extractProductInfo29cm(productElement) {
  // 기본 이미지 추출
  const img = productElement.querySelector("img");
  let imgSrc = img ? img.src || img.getAttribute("data-src") || "" : "";

  // 상품명 추출
  let productName = document.querySelector("#pdp_product_name")?.textContent?.trim() || "Unknown";

  // 브랜드명 추출
  let brand = document.querySelector(".css-1dncbyk.eezztd84")?.textContent?.trim() || "Unknown";

  // 가격 추출
  let price = "0";
  const priceElement = document.querySelector("#pdp_product_price");
  if (priceElement) {
    price = priceElement.textContent.trim();
  }

  return {
    name: productName,
    image: imgSrc,
    price: price,
    category: classifyCategory(productName),
    brand: brand,
  };
}

// 지그재그용 상품 정보 추출 함수
function extractProductInfoZigzag(productElement) {
  // 이미지 추출 (picture 태그의 첫 번째 이미지)
  const picture = document.querySelector("picture");
  let imgSrc = picture?.querySelector("img")?.src || "";

  // 브랜드명 추출
  let brand = document.querySelector(".pdp_shop_info_row .css-gwr30y.e18f5kdz1")?.textContent?.trim() || "Unknown";

  // 상품명 추출
  let productName = document.querySelector(".pdp__title .css-1n8byw.e14n6e5u1")?.textContent?.trim() || "Unknown";

  // 가격 추출
  let price = document.querySelector(".css-no59fe.e1ovj4ty1")?.textContent?.trim() || "0";

  return {
    name: productName,
    image: imgSrc,
    price: price,
    category: classifyCategory(productName),
    brand: brand,
  };
}

// 쇼핑몰 타입에 따라 적절한 추출 함수 사용
function extractProductInfo(productElement) {
  const hostname = window.location.hostname;
  let mall;
  let productInfo;

  if (hostname.includes("ssfshop")) {
    mall = "SSF";
    productInfo = extractProductInfoSSF(productElement);
  } else if (hostname.includes("musinsa")) {
    mall = "MUSINSA";
    productInfo = extractProductInfoMusinsa(productElement);
  } else if (hostname.includes("29cm")) {
    mall = "29CM";
    productInfo = extractProductInfo29cm(productElement);
  } else if (hostname.includes("zigzag")) {
    mall = "ZIGZAG";
    productInfo = extractProductInfoZigzag(productElement);
  }

  return {
    ...productInfo,
    mall: mall,
    url: window.location.href,
    maskOffset: productInfo.category === "Lower" ? 100 : 0
  };
}

// ✅ 카테고리 판별 함수
function classifyCategory(productName) {
  const lowerKeywords = [
    // 영문
    "pants", "jeans", "skirt", "shorts", "leggings", "slacks",
    // 한글
    "팬츠", "바지", "진", "청바지", "스커트", "치마", "레깅스", "슬랙스",
    "숏팬츠", "반바지", "쇼츠", "와이드팬츠", "조거팬츠", "카고팬츠", "데님"
  ];

  const dressKeywords = [
    // 영문
    "dress", "gown", "one-piece", "onepiece",
    // 한글
    "드레스", "원피스", "가운", "롱원피스", "미니원피스", "니트원피스"
  ];

  const upperKeywords = [
    // 영문
    "shirt", "blouse", "top", "jacket", "coat", "cardigan", "sweater", "hoodie", "sweatshirt", "t-shirt", "tee",
    // 한글
    "셔츠", "블라우스", "탑", "자켓", "코트", "가디건", "스웨터", "후드", "맨투맨", "티셔츠",
    "니트", "점퍼", "패딩", "집업", "베스트", "조끼", "크롭", "크롭티"
  ];

  // 신발 키워드 추가
  const shoesKeywords = [
    // 영문
    "shoes", "sneakers", "boots", "sandals", "loafers", "heels", "slippers",
    // 한글
    "신발", "운동화", "스니커즈", "부츠", "샌들", "로퍼", "힐", "슬리퍼",
    "플랫슈즈", "구두"
  ];

  // 악세서리 키워드 추가
  const accessoryKeywords = [
    // 영문
    "bag", "purse", "wallet", "belt", "hat", "cap", "scarf", "necklace", "earrings",
    "bracelet", "watch", "sunglasses", "glasses", "ring", "jewelry",
    // 한글
    "가방", "지갑", "벨트", "모자", "스카프", "목걸이", "귀걸이", "팔찌",
    "시계", "선글라스", "안경", "반지", "쥬얼리", "악세서리", "액세서리"
  ];

  const nameLower = productName.toLowerCase();

  if (shoesKeywords.some((keyword) => nameLower.includes(keyword))) {
    return "Shoes";
  }
  if (accessoryKeywords.some((keyword) => nameLower.includes(keyword))) {
    return "Accessory";
  }
  if (dressKeywords.some((keyword) => nameLower.includes(keyword))) {
    return "Dress";
  }
  if (lowerKeywords.some((keyword) => nameLower.includes(keyword))) {
    return "Lower";
  }
  if (upperKeywords.some((keyword) => nameLower.includes(keyword))) {
    return "Upper";
  }
  
  // 기본값은 Unknown으로 설정
  return "Unknown";
}

// ✅ 사용자 피드백 표시 함수
function showFeedback(element, message) {
  const feedback = document.createElement("div");
  feedback.textContent = message;
  feedback.style.position = "fixed";
  feedback.style.top = "20px";
  feedback.style.left = "50%";
  feedback.style.transform = "translateX(-50%)";
  feedback.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  feedback.style.color = "white";
  feedback.style.padding = "10px 20px";
  feedback.style.borderRadius = "5px";
  feedback.style.zIndex = "100000";
  document.body.appendChild(feedback);

  element.style.outline = "2px solid green";

  setTimeout(() => {
    feedback.remove();
    element.style.outline = "";
  }, 2000);
}

console.log("✅ 상품 선택 기능 추가 완료!");