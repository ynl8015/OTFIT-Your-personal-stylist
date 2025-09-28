// FitDit API 호출
import { Client } from "@gradio/client"

export const tryOnWithFitDiT = async (userImage, clothingImageUrl, category) => {
  try {
    console.log("tryOnWithFitDiT 호출됨", {
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
    const client = await Client.connect("BoyuanJiang/FitDiT")
    console.log("Gradio 클라이언트 연결 완료")

    // 1단계: 마스크 생성 API 호출
    console.log("마스크 생성 API 호출 준비")
    const maskResult = await client.predict("/generate_mask", {
      vton_img: userImageBlob,
      category: mappedCategory,
      offset_top: 0,
      offset_bottom: 0,
      offset_left: 0,
      offset_right: 0,
    })

    console.log("마스크 생성 API 호출 완료, 응답:", maskResult)

    // 마스크와 포즈 이미지 추출
    if (!maskResult || !maskResult.data || maskResult.data.length < 2) {
      console.error("마스크 생성 API 응답에 데이터가 없습니다:", maskResult)
      throw new Error("마스크 생성 API 응답에 데이터가 없습니다")
    }

    const maskedImage = maskResult.data[0]
    const poseImage = maskResult.data[1]

    console.log("마스크 이미지:", maskedImage)
    console.log("포즈 이미지:", poseImage)

    // 2단계: 실제 가상 착용 처리 API 호출
    console.log("가상 착용 처리 API 호출 준비")
    const result = await client.predict("/process", {
      vton_img: userImageBlob,
      garm_img: clothingImageBlob,
      pre_mask: maskedImage,
      pose_image: poseImage,
      n_steps: 20,
      image_scale: 2,
      seed: -1,
      num_images_per_prompt: 1,
      resolution: "768x1024",
    })

    console.log("가상 착용 API 호출 완료, 응답:", result)

    // API 응답 처리 - 이미지 URL 추출
    if (result && result.data) {
      console.log("결과 데이터:", result.data)

      // FitDiT API의 /process 엔드포인트는 Gallery 컴포넌트를 반환하므로
      // 이미지 URL 직접 추출 시도
      let imageUrl = null

      // 응답 구조 전체 로깅
      console.log("결과 데이터 구조:", JSON.stringify(result.data, null, 2))

      // Gallery 컴포넌트 응답 구조 분석
      if (Array.isArray(result.data)) {
        // 배열이 비어있지 않은지 확인
        if (result.data.length > 0) {
          const firstImage = result.data[0]
          console.log("첫 번째 이미지:", firstImage)

          // 결과 이미지 처리
          imageUrl = processImageResponse(firstImage)
        } else {
          console.error("결과 배열이 비어있습니다")
          throw new Error("결과 이미지가 없습니다")
        }
      } else {
        // 배열이 아닌 경우 직접 처리
        imageUrl = processImageResponse(result.data)
      }

      console.log("처리된 이미지 URL:", imageUrl)

      if (imageUrl) {
        return imageUrl
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
  console.log("이미지 응답 처리 시작:", response)

  // undefined 또는 null 체크
  if (!response) {
    console.error("응답이 비어있습니다")
    return null
  }

  // Gallery 컴포넌트 응답 형식 처리 (배열인 경우)
  if (Array.isArray(response)) {
    if (response.length === 0) {
      console.error("응답 배열이 비어있습니다")
      return null
    }
    console.log("배열 응답 발견, 첫 번째 항목 처리:", response[0])
    // 첫 번째 이미지 사용
    return processImageResponse(response[0])
  }

  // 응답이 문자열인 경우
  if (typeof response === "string") {
    console.log("문자열 응답 처리:", response)

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
      const url = `https://huggingface.co/spaces/BoyuanJiang/FitDiT/resolve/main${response}`
      console.log("상대 경로를 HuggingFace URL로 변환:", url)
      return url
    }

    // 그 외 문자열 (파일명 등)
    const url = `https://huggingface.co/spaces/BoyuanJiang/FitDiT/resolve/main/results/${response}`
    console.log("파일명을 HuggingFace 기본 경로로 변환:", url)
    return url
  }

  // 응답이 객체인 경우
  if (typeof response === "object" && response !== null) {
    console.log("객체 응답 처리:", Object.keys(response))

    // name 필드가 있는 경우 (Gallery 컴포넌트의 일반적인 형식)
    if (response.name) {
      console.log("name 필드 감지:", response.name)
      // name을 기반으로 URL 구성
      const url = `https://huggingface.co/spaces/BoyuanJiang/FitDiT/resolve/main/results/${response.name}`
      console.log("name에서 URL 생성:", url)
      return url
    }

    // URL 필드가 있는 경우
    if (response.url) {
      console.log("객체에서 URL 필드 반환:", response.url)
      return response.url
    }

    // 경로 필드가 있는 경우
    if (response.path) {
      const url = `https://huggingface.co/spaces/BoyuanJiang/FitDiT/resolve/main${response.path}`
      console.log("객체에서 경로 필드를 변환:", url)
      return url
    }

    // data 필드가 있는 경우
    if (response.data) {
      console.log("객체에서 data 필드 처리")
      return processImageResponse(response.data)
    }

    // image 필드가 있는 경우
    if (response.image) {
      console.log("객체에서 image 필드 처리")
      return processImageResponse(response.image)
    }

    // FitDiT Gallery 컴포넌트 특화 처리
    if (response.orig_name) {
      const url = `https://huggingface.co/spaces/BoyuanJiang/FitDiT/resolve/main/results/${response.orig_name}`
      console.log("orig_name에서 URL 생성:", url)
      return url
    }

    // 모든 키를 로깅하여 디버깅
    console.log("객체 키:", Object.keys(response))
    for (const key in response) {
      console.log(`${key}:`, response[key])
    }
  }

  console.error("처리할 수 없는 응답 형식:", typeof response)
  return null
}

// 카테고리 매핑 함수
function mapCategory(category) {
  // FitDiT API에서 기대하는 형식으로 카테고리 변환
  console.log("카테고리 매핑 입력:", category)

  // FitDiT API는 "Upper-body", "Lower-body", "Dresses" 포맷 사용
  switch (category) {
    case "Upper":
      return "Upper-body"
    case "Lower":
      return "Lower-body"
    case "Dress":
      return "Dresses"
    case "upper_body":
      return "Upper-body"
    case "lower_body":
      return "Lower-body"
    case "dresses":
      return "Dresses"
    default:
      // 이미 매핑된 값이거나 알 수 없는 값
      if (["Upper-body", "Lower-body", "Dresses"].includes(category)) {
        return category // 이미 매핑된 형식이면 그대로 사용
      }
      console.log("알 수 없는 카테고리, 기본값 Upper-body 사용")
      return "Upper-body" // 기본값
  }
}
