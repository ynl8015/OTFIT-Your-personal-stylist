// 카톡 공유
export const shareKakao = (imageUrl) => {
  if (!window.Kakao) return
  window.Kakao.init("YOUR_KAKAO_APP_KEY")

  window.Kakao.Link.sendDefault({
    objectType: "feed",
    content: {
      title: "가상 착용 결과",
      description: "내가 선택한 옷을 가상으로 착용해봤어요!",
      imageUrl: imageUrl,
      link: {
        mobileWebUrl: imageUrl,
        webUrl: imageUrl,
      },
    },
  })
}
