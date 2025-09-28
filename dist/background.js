// 콘텐츠 스크립트에서 받은 상품 데이터를 팝업 UI로 전달
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  // 상품 선택 모드에서 상품 선택 시
  if (message.action === "ADD_TO_CART" || message.action === "tryOn") {
    // 상품 데이터를 통일된 형식으로 저장
    const productData = message.product || message.data;

    chrome.storage.local.set({ selectedProduct: productData }, () => {
      console.log("✅ 상품 데이터 저장 완료!", productData);
    });

    // content.js로 상품 선택 모드 종료 신호 전송
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "selectionComplete" });
      }
    });
  }
});
