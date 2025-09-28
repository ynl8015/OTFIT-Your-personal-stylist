import React, { useState, useEffect, useRef } from "react"
import { tryOnWithFitDiT } from "../api/api-fitdit"
import { tryOnWithLeffa } from "../api/api-leffa"
import styles from "./VirtualFitting.module.css"
import ProductEditModal from "./ProductEditModal"

const VirtualFitting = () => {
  const [userImage, setUserImage] = useState(null)
  const [userImageFile, setUserImageFile] = useState(null)
  const [product, setProduct] = useState(null)
  const [resultImage, setResultImage] = useState(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isGuideExpanded, setIsGuideExpanded] = useState(false)
  const [isPurposeExpanded, setPurposeExpanded] = useState(false)
  const [fitditCallCount, setFitditCallCount] = useState(0)
  const [selectedService, setSelectedService] = useState(null)
  const [garmImg, setGarmImg] = useState(null)
  const [category, setCategory] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProduct, setEditedProduct] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // 파일 입력 참조
  const fileInputRef = useRef(null)

  // 확장 프로그램이 실행될 때 저장된 상품 데이터를 가져옴
  useEffect(() => {
    console.log("VirtualFitting 컴포넌트 마운트")

    // chrome 객체 접근성 확인
    if (typeof chrome !== "undefined" && chrome.storage) {
      console.log("Chrome API 사용 가능")

      try {
        // 현재 저장된 상품 데이터 확인 (디버깅)
        chrome.storage.local.get(["selectedProduct", "fittingResults"], (data) => {
          console.log("Chrome 스토리지 데이터 조회 시도:", data)

          if (data && data.selectedProduct) {
            console.log("저장된 상품 데이터 로드:", data.selectedProduct)
            setProduct(data.selectedProduct)

            // 저장된 가상 착용 결과 확인
            if (data.fittingResults && data.selectedProduct.image && data.fittingResults[data.selectedProduct.image]) {
              console.log("저장된 가상 착용 결과 로드")
              setResultImage(data.fittingResults[data.selectedProduct.image])
            }
          } else {
            console.log("저장된 상품 데이터 없음")
          }
        })

        // 상품 데이터 변경 감지 리스너
        const storageListener = (changes, namespace) => {
          console.log("스토리지 변경 감지:", changes, namespace)

          if (namespace === "local" && changes.selectedProduct) {
            console.log("상품 데이터 변경 감지:", changes.selectedProduct.newValue)
            setProduct(changes.selectedProduct.newValue)
            setIsSelecting(false) // 상품 선택 완료 시 모드 비활성화

            // 새로운 상품의 저장된 가상 착용 결과 확인
            chrome.storage.local.get(["fittingResults"], (data) => {
              if (data.fittingResults && changes.selectedProduct.newValue && changes.selectedProduct.newValue.image && data.fittingResults[changes.selectedProduct.newValue.image]) {
                console.log("새 상품의 저장된 가상 착용 결과 로드")
                setResultImage(data.fittingResults[changes.selectedProduct.newValue.image])
              } else {
                // 새 상품에 저장된 결과가 없으면 결과 이미지 초기화
                setResultImage(null)
              }
            })
          }
        }

        // 리스너 등록
        chrome.storage.onChanged.addListener(storageListener)

        // 클린업 함수
        return () => {
          chrome.storage.onChanged.removeListener(storageListener)
          console.log("스토리지 리스너 제거됨")
        }
      } catch (err) {
        console.error("Chrome API 사용 중 오류:", err)
        setError("크롬 확장 프로그램 API 접근 오류: " + err.message)
      }
    } else {
      console.error("Chrome API가 정의되지 않았습니다. 크롬 확장 프로그램 환경에서 실행 중인지 확인하세요.")
      setError("크롬 API에 접근할 수 없습니다. 확장 프로그램 환경에서 실행해주세요.")
    }
  }, [])

  useEffect(() => {
    chrome.storage.local.get(["tempUserImage"], (result) => {
      if (result.tempUserImage) {
        setUserImage(result.tempUserImage)
      }
    })
  }, [])

  // 저장된 의류 정보 불러오기
  useEffect(() => {
    chrome.storage.local.get(["selectedGarment"], (result) => {
      if (result.selectedGarment) {
        setGarmImg(result.selectedGarment.image)
        setCategory(result.selectedGarment.category)
      }
    })
  }, [])

  // 사용자 본인 사진 업로드
  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      // 파일 사이즈 체크 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        alert("이미지 크기가 너무 큽니다. 10MB 이하의 이미지를 선택해주세요.")
        return
      }

      // 이미지 파일 타입 체크
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 선택 가능합니다.")
        return
      }

      setUserImageFile(file)

      // Blob URL 생성
      const objectUrl = URL.createObjectURL(file)
      setUserImage(objectUrl)
      console.log("사용자 이미지 설정 (Blob URL):", objectUrl)

      // 파일 정보 로깅
      console.log("사용자 이미지 파일 정보:", {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`,
      })
    }
  }

  // 가상 착용 결과 저장 함수
  const saveFittingResult = (productImageUrl, resultImageUrl) => {
    chrome.storage.local.get(["fittingResults"], (result) => {
      const currentResults = result.fittingResults || {}
      const newResults = {
        ...currentResults,
        [productImageUrl]: resultImageUrl,
      }

      chrome.storage.local.set({ fittingResults: newResults }, () => {
        console.log("가상 착용 결과 저장 완료:", newResults)
      })
    })
  }

  // fitdit 리밋 체크하기
  const checkFitditCallLimit = async () => {
    try {
      const response = await chrome.storage.local.get(["fitditCallCount"])
      const count = response.fitditCallCount || 0
      setFitditCallCount(count)
      return count < 50 // Assuming 50 is the daily limit
    } catch (error) {
      console.error("Failed to check FitDiT call limit:", error)
      return false
    }
  }

  // 가상피팅 가능 여부 체크 함수 추가
  const isFittingAvailable = (category) => {
    const availableCategories = ["Upper", "Lower", "Dress", "상의", "하의", "원피스"]
    return availableCategories.includes(category)
  }

  const handleTryOn = async () => {
    if (!userImage || !product) {
      alert("본인 사진과 상품을 선택해주세요!")
      return
    }

    // 카테고리 체크 추가
    if (!isFittingAvailable(product.category)) {
      alert("상의, 하의, 원피스만 가상피팅이 가능합니다.")
      return
    }

    setError(null)
    setIsLoading(true)
    setResultImage(null)

    try {
      let result
      // 먼저 FitDiT 사용 가능 여부 확인
      const canUseFitdit = await checkFitditCallLimit()

      if (canUseFitdit) {
        try {
          result = await tryOnWithFitDiT(userImage, product.image, product.category)
          // 성공적인 호출 시 카운트 증가
          const newCount = fitditCallCount + 1
          setFitditCallCount(newCount)
          chrome.storage.local.set({ fitditCallCount: newCount })
        } catch (error) {
          // FitDiT 실패 시 Leffa로 폴백
          console.log("FitDiT 처리 실패, Leffa로 전환:", error)
          result = await tryOnWithLeffa(userImage, product.image, product.category)
        }
      } else {
        // 한도 초과 시 Leffa로 전환
        alert("일일 할당량을 초과하여 가벼운 모델로 전환됩니다.")
        result = await tryOnWithLeffa(userImage, product.image, product.category)
      }

      if (result) {
        setResultImage(result)
        saveFittingResult(product.image, result)
      } else {
        throw new Error("결과 이미지를 받지 못했습니다.")
      }
    } catch (error) {
      console.error("가상 착용 실패:", error)
      setError(error.message || "가상 착용 중 오류가 발생했습니다.")
      alert(`가상 착용 중 오류가 발생했습니다: ${error.message || "알 수 없는 오류"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 상품 선택 모드 토글
  const toggleSelectMode = () => {
    if (typeof chrome === "undefined" || !chrome.tabs) {
      setError("크롬 확장 프로그램 API에 접근할 수 없습니다.")
      return
    }

    const newState = !isSelecting
    setIsSelecting(newState)

    console.log("상품 선택 모드 토글:", newState)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleSelect" })
      } else {
        console.log("현재 탭을 찾을 수 없습니다")
        setError("현재 탭을 찾을 수 없습니다. 쇼핑몰 페이지에서 실행해주세요.")
      }
    })
  }

  // 가이드 더보기/접기 토글
  const toggleGuide = () => {
    setIsGuideExpanded(!isGuideExpanded)
  }

  // 서비스 목적 토글 추가
  const togglePurpose = () => {
    setPurposeExpanded(!isPurposeExpanded)
  }

  // 장바구니 담기 함수 추가
  const handleAddToCart = () => {
    if (!product) return

    console.log("Adding to cart:", product)

    chrome.storage.local.get(["cartItems"], (result) => {
      const currentCart = result.cartItems || []

      // 중복 체크
      const isDuplicate = currentCart.some((item) => item.url === product.url)
      if (isDuplicate) {
        alert("이미 장바구니에 있는 상품입니다.")
        return
      }

      // Cart.jsx에서 필요로 하는 형식에 맞게 데이터 구조화
      const cartItem = {
        ...product,
        id: `${product.url}-${product.image}`,
        price: product.price || "0원", // price가 없는 경우 기본값 설정
        mall: product.mall || "기타",
        brand: product.brand || "기타",
        category: product.category || "Upper", // 기본 카테고리 설정
      }

      const newCart = [...currentCart, cartItem]
      chrome.storage.local.set({ cartItems: newCart }, () => {
        console.log("Cart updated:", newCart)
        alert("장바구니에 추가되었습니다!")
      })
    })
  }

  // 파일 업로드 트리거 함수
  const triggerFileUpload = () => {
    fileInputRef.current.click()
  }

  // 상품 정보 수정 저장 핸들러
  const handleSaveEdit = (e) => {
    e.stopPropagation()
    setProduct({ ...product, ...editedProduct })
    setIsEditing(false)

    // Chrome storage 업데이트
    chrome.storage.local.get(["selectedProduct"], (result) => {
      const updatedProduct = { ...result.selectedProduct, ...editedProduct }
      chrome.storage.local.set({ selectedProduct: updatedProduct })
    })
  }

  // product가 변경될 때 editedProduct 초기화
  useEffect(() => {
    if (product) {
      setEditedProduct(product)
    }
  }, [product])

  const handleEditClick = (e) => {
    e.stopPropagation()
    setIsEditModalOpen(true)
  }

  const handleEditSave = (editedProduct) => {
    // 상품 정보 업데이트
    setProduct(editedProduct)
    setIsEditModalOpen(false)

    // Chrome storage 업데이트
    chrome.storage.local.get(["selectedProduct", "cartItems"], (result) => {
      // selectedProduct 업데이트
      chrome.storage.local.set({ selectedProduct: editedProduct })

      // 장바구니에 있는 동일 상품 업데이트
      if (result.cartItems) {
        const updatedCart = result.cartItems.map((item) =>
          // URL로 동일 상품 식별 (이미지는 변경될 수 있으므로)
          item.url === editedProduct.url ? { ...item, ...editedProduct } : item
        )

        chrome.storage.local.set({ cartItems: updatedCart }, () => {
          console.log("장바구니 상품 정보 업데이트 완료:", updatedCart)
        })
      }
    })
  }

  // 초기화 함수 추가
  const handleReset = () => {
    setProduct(null)
    setUserImage(null)
    setUserImageFile(null)
    setResultImage(null)
    setError(null)
    
    // Chrome storage에서 가상피팅 관련 데이터 초기화
    chrome.storage.local.remove([
      'tempUserImage',
      'selectedProduct',
      'fittingResults',
      'selectedGarment'
    ], () => {
      console.log('가상피팅 관련 데이터가 초기화되었습니다.')
    })
  }

  return (
    <div className={styles.container}>
      {/* 가이드 섹션 - 접을 수 있도록 변경 */}
      <div className={`${styles.section} ${styles.guide}`}>
        <div className={styles.guideTitleContainer} onClick={toggleGuide}>
          <p className={styles.guideTitle}>📌 [필독] OTFIT 사용 가이드</p>
          <button className={styles.guideToggleButton} aria-label={isGuideExpanded ? "가이드 접기" : "가이드 펼치기"}>
            {isGuideExpanded ? "▴" : "▾"}
          </button>
        </div>

        <ol className={`${styles.guideList} ${isGuideExpanded ? styles.guideExpanded : styles.guideCollapsed}`}>
          <li className={styles.guideItem}>무신사, SSF, 지그재그, 29cm을 대표적으로 지원합니다</li>
          <li className={styles.guideItem}>해당 쇼핑몰의 상세페이지를 통해 상품 이미지를 선택하세요</li>
          <li className={styles.guideItem}>그외 쇼핑몰은 수정하기 버튼 내의 붙여넣기 기능을 사용해주세요</li>
        </ol>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenFileInput}
        onChange={(event) => {
          const file = event.target.files[0]
          if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
              chrome.storage.local.set({ tempUserImage: reader.result }, () => handleFileChange(event))
            }
            reader.readAsDataURL(file)
          }
        }}
      />

      {/* 메인 삼분할 레이아웃 */}
      <div className={styles.mainLayout}>
        <div className={styles.leftColumn}>
          {/* 상품 이미지 - 클릭 시 상품 선택 */}
          <div className={`${styles.imageCard} ${styles.clickable}`} onClick={toggleSelectMode}>
            <div className={styles.imageHeader}>
              <span>상품</span>
              {product && (
                <button className={styles.editButton} onClick={handleEditClick}>
                  수정
                </button>
              )}
            </div>
            <div className={styles.imageWrapper}>
              {product ? (
                <>
                  <img src={product.image} alt={product.name} className={styles.image} />
                  <div className={styles.hoverOverlay}>
                    <span className={styles.hoverMessage}>다른 상품 선택하기</span>
                  </div>
                </>
              ) : (
                <div className={styles.emptyImageText}>클릭하여 <br/>상품 선택</div>
              )}
            </div>

            {product && (
              <div className={styles.productInfo}>
                {isEditing ? (
                  <div className={styles.editForm}>
                    <input
                      type="text"
                      value={editedProduct.brand || ""}
                      onChange={(e) => setEditedProduct({ ...editedProduct, brand: e.target.value })}
                      placeholder="브랜드"
                      className={styles.editInput}
                    />
                    <input
                      type="text"
                      value={editedProduct.name || ""}
                      onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                      placeholder="상품명"
                      className={styles.editInput}
                    />
                    <div className={styles.editActions}>
                      <button onClick={handleSaveEdit} className={styles.saveButton}>
                        저장
                      </button>
                      <button onClick={() => setIsEditing(false)} className={styles.cancelButton}>
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={styles.productName} title={product.name}>
                    {product.brand && <span className={styles.brandName}>{product.brand}</span>}
                    {product.name}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 사용자 이미지 - 클릭 시 파일 업로드 */}
          <div className={`${styles.imageCard} ${styles.clickable}`} onClick={triggerFileUpload}>
            <div className={styles.imageHeader}>
              <span>내 사진</span>
            </div>
            <div className={styles.imageWrapper}>
              {userImage ? (
                <>
                  <img src={userImage} alt="User" className={styles.image} />
                  <div className={styles.hoverOverlay}>
                    <span className={styles.hoverMessage}>다른 사진 선택하기</span>
                  </div>
                </>
              ) : (
                <div className={styles.emptyImageText}>클릭하여 <br/> 사진 선택</div>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: 결과 이미지 */}
        <div className={styles.rightColumn}>
          <div className={styles.resultCard}>
            <div className={styles.imageHeader}>
              <span>가상 착용 결과</span>
            </div>

            {/* 결과 이미지 영역 */}
            <div className={styles.resultImageWrapper}>
              {resultImage ? (
                <div className={styles.resultContainer}>
                  <img src={resultImage} alt="Virtual Try-On Result" className={styles.resultImage} />
                </div>
              ) : (
                <div className={styles.emptyResultFrame}>
                  <div className={styles.guideMessage}>
                    <p>가상 피팅을 통해 더 정확한 핏을 확인해보세요!</p>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className={styles.loadingOverlay}>
                  <div className={styles.spinner}></div>
                  <p className={styles.loadingText}>
                    최대 1분 소요
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 오류 메시지 */}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {isEditModalOpen && <ProductEditModal product={product} onSave={handleEditSave} onClose={() => setIsEditModalOpen(false)} />}

      {/* 하단 버튼 영역 */}
      <div className={styles.footerButtons}>
        {/* 결과 이미지가 없을 때: 가상 피팅하기 버튼을 메인으로 표시 */}
        {!resultImage ? (
          <>
            <button onClick={handleTryOn} disabled={!userImage || !product || isLoading} className={styles.footerButton}>
              가상 피팅하기
            </button>

            {/* 텍스트 링크 컨테이너 */}
            <div className={styles.textLinksContainer}>
              <button onClick={handleAddToCart} disabled={!product} className={styles.textLink}>
                장바구니에 담기
              </button>

              <span className={styles.textLinkSeparator}>|</span>

              <button disabled={true} className={styles.textLinkDisabled}>
                이미지 저장하기
              </button>
            </div>
          </>
        ) : (
          /* 결과 이미지가 있을 때: 장바구니에 담기 버튼을 메인으로 표시 */
          <>
            <button onClick={handleAddToCart} disabled={!product} className={styles.footerButton}>
              장바구니에 담기
            </button>

            {/* 텍스트 링크 컨테이너 - 이미지 저장하기와 초기화 표시 */}
            <div className={styles.textLinksContainer}>
              <a href={resultImage} download="try-on-result.jpg" className={styles.textLink}>
                이미지 저장하기
              </a>
              <span className={styles.textLinkSeparator}>|</span>
              <button onClick={handleReset} className={styles.textLink}>
                초기화
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default VirtualFitting
