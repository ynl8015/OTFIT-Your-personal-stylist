// fitdit API 호출
import { Client } from "@gradio/client"

export const tryOnWithLeffa = async (userImage, clothingImageUrl, category) => {
  try {
    console.log("tryOnWithLeffa 호출됨", {
      userImage: userImage ? "이미지 있음" : "없음",
      clothingImageUrl,
      category,
    })

    // 이미지를 Blob 객체로 변환하는 함수
    const urlToBlob = async (url) => {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`이미지 로드 실패: ${response.status} ${response.statusText}`)
        }
        return await response.blob()
      } catch (error) {
        console.error("이미지 변환 오류:", error)
        throw new Error(`이미지 변환 중 오류: ${error.message}`)
      }
    }

    // 사용자 이미지와 의류 이미지를 Blob로 변환
    let userImageBlob
    let clothingImageBlob

    console.log("이미지 변환 시작")

    // 사용자 이미지 처리 (base64 또는 Blob URL)
    try {
      if (userImage.startsWith("data:")) {
        // base64 이미지를 Blob으로 변환
        const response = await fetch(userImage)
        userImageBlob = await response.blob()
      } else {
        // URL을 Blob으로 변환
        userImageBlob = await urlToBlob(userImage)
      }
      console.log("사용자 이미지 변환 완료:", {
        type: userImageBlob.type,
        size: `${(userImageBlob.size / 1024).toFixed(2)} KB`,
      })
    } catch (error) {
      console.error("사용자 이미지 변환 실패:", error)
      throw new Error("사용자 이미지를 처리할 수 없습니다: " + error.message)
    }

    // 의류 이미지 처리
    try {
      clothingImageBlob = await urlToBlob(clothingImageUrl)
      console.log("의류 이미지 변환 완료:", {
        type: clothingImageBlob.type,
        size: `${(clothingImageBlob.size / 1024).toFixed(2)} KB`,
      })
    } catch (error) {
      console.error("의류 이미지 변환 실패:", error)
      throw new Error("의류 이미지를 처리할 수 없습니다: " + error.message)
    }

    // 카테고리 매핑
    const mappedCategory = mapCategory(category)
    console.log("매핑된 카테고리:", mappedCategory)

    // Gradio 클라이언트 연결
    console.log("Gradio 클라이언트 연결 시작")
    const client = await Client.connect("franciszzj/Leffa")
    console.log("Gradio 클라이언트 연결 완료")

    // API 호출 전 로깅
    console.log("Leffa API 호출 준비 완료")

    // API 문서에 따라 객체 형태로 파라미터 전달
    // 중요: Boolean 값으로 전달
    const result = await client.predict("/leffa_predict_vt", {
      src_image_path: userImageBlob,
      ref_image_path: clothingImageBlob,
      ref_acceleration: false, // Boolean 값으로 전달
      step: 30,
      scale: 2.5,
      seed: 42,
      vt_model_type: "viton_hd",
      vt_garment_type: mappedCategory,
      vt_repaint: false, // Boolean 값으로 전달
    })

    console.log("API 호출 완료, 응답:", result)

    // API 응답 처리 - 이미지 URL 추출
    if (result && result.data) {
      console.log("결과 데이터:", result.data)

      // 결과 이미지 처리
      const processedImage = processImageResponse(result.data[0])
      console.log("처리된 이미지 URL:", processedImage)

      if (processedImage) {
        return processedImage
      } else {
        throw new Error("결과 이미지를 처리할 수 없습니다")
      }
    } else {
      console.error("API 응답에 데이터가 없습니다:", result)
      throw new Error("API 응답에 데이터가 없습니다")
    }
  } catch (error) {
    console.error("가상 착용 API 호출 중 오류 발생:", error)
    throw error
  }
}

// 이미지 응답 처리 함수
function processImageResponse(response) {
  console.log("이미지 응답 처리:", response)

  // undefined 또는 null 체크
  if (!response) {
    console.error("응답이 비어있습니다")
    return null
  }

  // 응답이 문자열인 경우
  if (typeof response === "string") {
    // 이미 data:image/ 형식인 경우 (base64 데이터)
    if (response.startsWith("data:image/")) {
      console.log("base64 이미지 반환")
      return response
    }

    // 절대 URL인 경우 (http, https)
    if (response.startsWith("http://") || response.startsWith("https://")) {
      console.log("절대 URL 반환")
      return response
    }

    // 상대 URL 또는 파일 경로인 경우
    if (response.startsWith("/")) {
      console.log("상대 경로를 HuggingFace URL로 변환")
      return `https://huggingface.co/spaces/franciszzj/Leffa/resolve/main${response}`
    }

    // 그 외 문자열 (파일명 등)
    console.log("파일명을 HuggingFace 기본 경로로 변환")
    return `https://huggingface.co/spaces/franciszzj/Leffa/resolve/main/results/${response}`
  }

  // 응답이 객체인 경우
  if (typeof response === "object" && response !== null) {
    // URL 필드가 있는 경우
    if (response.url) {
      console.log("객체에서 URL 필드 반환")
      return response.url
    }

    // 경로 필드가 있는 경우
    if (response.path) {
      console.log("객체에서 경로 필드를 변환")
      return `https://huggingface.co/spaces/franciszzj/Leffa/resolve/main${response.path}`
    }

    // data 필드가 있는 경우
    if (response.data) {
      console.log("객체에서 data 필드 처리")
      return processImageResponse(response.data)
    }
  }

  console.error("처리할 수 없는 응답 형식")
  return null
}

// 카테고리 매핑 함수
function mapCategory(category) {
  // Leffa API에서 기대하는 형식으로 카테고리 변환
  console.log("카테고리 매핑 입력:", category)

  // 카테고리는 upper_body, lower_body, dresses 중 하나여야 함
  switch (category) {
    case "Upper":
      return "upper_body"
    case "Lower":
      return "lower_body"
    case "Dress":
      return "dresses"
    default:
      // 기본값 또는 이미 매핑된 값 처리
      if (["upper_body", "lower_body", "dresses"].includes(category)) {
        return category // 이미 매핑된 형식이면 그대로 사용
      }
      console.log("알 수 없는 카테고리, 기본값 upper_body 사용")
      return "upper_body" // 기본값
  }
}