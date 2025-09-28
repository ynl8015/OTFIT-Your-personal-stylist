import React, { useState, useEffect } from "react"
import styles from "./Cart.module.css"
import Moodboard from "./Moodboard"

const Cart = () => {
  const [cartItems, setCartItems] = useState([])
  const [groupedItems, setGroupedItems] = useState({})
  const [fittingResults, setFittingResults] = useState({})
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [showMoodboard, setShowMoodboard] = useState(false)

  useEffect(() => {
    loadCartItems()
    loadFittingResults()
  }, [])

  const loadCartItems = () => {
    chrome.storage.local.get(["cartItems"], (result) => {
      console.log("Loading cart:", result.cartItems || [])
      const items = result.cartItems || []
      // 각 아이템에 고유 ID 부여 (없는 경우)
      const itemsWithIds = items.map((item) => ({
        ...item,
        id: item.id || `${item.url}-${item.image}`, // URL과 이미지를 조합하여 고유 ID 생성
        // 가격 정규화 (쉼표 추가)
        price: item.price.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원",
      }))
      setCartItems(itemsWithIds)

      // 쇼핑몰별로 먼저 그룹화하고, 그 안에서 브랜드별로 그룹화
      const grouped = itemsWithIds.reduce((acc, item) => {
        const mall = item.mall || "기타"
        const brand = item.brand || "기타"

        if (!acc[mall]) {
          acc[mall] = {}
        }
        if (!acc[mall][brand]) {
          acc[mall][brand] = []
        }
        acc[mall][brand].push(item)
        return acc
      }, {})

      setGroupedItems(grouped)
    })
  }

  const loadFittingResults = () => {
    chrome.storage.local.get(["fittingResults"], (result) => {
      console.log("Loading fitting results:", result.fittingResults || {})
      setFittingResults(result.fittingResults || {})
    })
  }

  const removeFromCart = (itemToRemove) => {
    const newCart = cartItems.filter((item) => item !== itemToRemove)
    chrome.storage.local.set({ cartItems: newCart }, () => {
      setCartItems(newCart)
      loadCartItems() // 그룹화된 아이템 다시 로드
    })
  }

  const openProductPage = (url) => {
    if (url) {
      chrome.tabs.create({ url })
    } else {
      alert("상품 페이지 URL이 없습니다.")
    }
  }

  // 이미지 URL을 키로 사용하여 가상 착용 결과 이미지 가져오기
  const getFittingImage = (productImageUrl) => {
    return fittingResults[productImageUrl] || null
  }

  const toggleSelectAll = (isSelect) => {
    if (isSelect) {
      const allItemIds = cartItems.map((item) => item.id)
      setSelectedItems(new Set(allItemIds))
    } else {
      setSelectedItems(new Set())
    }
  }

  const toggleSelectItem = (itemId) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const calculateTotalPrice = () => {
    return (
      cartItems
        .filter((item) => selectedItems.has(item.id))
        .reduce((total, item) => {
          const price = parseInt(item.price.replace(/[^0-9]/g, ""))
          return total + price
        }, 0)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원"
    )
  }

  const isAllSelected = cartItems.length > 0 && selectedItems.size === cartItems.length
  const isPartiallySelected = selectedItems.size > 0 && selectedItems.size < cartItems.length

  const createShareImage = async () => {
    if (selectedItems.size === 0) {
      alert("공유할 상품을 선택해주세요.")
      return
    }

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    const itemsToShare = cartItems.filter((item) => selectedItems.has(item.id))

    // 정사각형 캔버스 (인스타그램 최적화)
    canvas.width = 1080
    canvas.height = 1080

    try {
      // 배경 설정
      ctx.fillStyle = "#f8f8f8"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 각 이미지의 기본 크기 설정 (다양한 크기로 배치)
      const layouts = [
        // 3개 이하일 때
        [
          { x: 200, y: 150, w: 500, h: 600, rotation: -5 },
          { x: 400, y: 300, w: 450, h: 550, rotation: 5 },
          { x: 300, y: 200, w: 480, h: 580, rotation: 0 },
        ],
        // 4-5개일 때
        [
          { x: 150, y: 100, w: 400, h: 500, rotation: -8 },
          { x: 400, y: 150, w: 450, h: 550, rotation: 5 },
          { x: 250, y: 300, w: 380, h: 480, rotation: -3 },
          { x: 500, y: 400, w: 420, h: 520, rotation: 6 },
          { x: 300, y: 450, w: 400, h: 500, rotation: -4 },
        ],
        // 6개 이상일 때
        [
          { x: 100, y: 100, w: 350, h: 450, rotation: -8 },
          { x: 350, y: 150, w: 380, h: 480, rotation: 5 },
          { x: 200, y: 300, w: 330, h: 430, rotation: -3 },
          { x: 450, y: 350, w: 360, h: 460, rotation: 6 },
          { x: 250, y: 450, w: 340, h: 440, rotation: -4 },
          { x: 500, y: 200, w: 370, h: 470, rotation: 7 },
        ],
      ]

      // 아이템 수에 따라 적절한 레이아웃 선택
      const layoutIndex = itemsToShare.length <= 3 ? 0 : itemsToShare.length <= 5 ? 1 : 2
      const currentLayout = layouts[layoutIndex]

      // 이미지 그리기
      for (let i = 0; i < Math.min(itemsToShare.length, currentLayout.length); i++) {
        const item = itemsToShare[i]
        const layout = currentLayout[i]
        const img = await loadImage(getFittingImage(item.image) || item.image)

        // 그림자 효과
        ctx.save()
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)"
        ctx.shadowBlur = 15
        ctx.shadowOffsetX = 5
        ctx.shadowOffsetY = 5

        // 회전 적용
        ctx.translate(layout.x + layout.w / 2, layout.y + layout.h / 2)
        ctx.rotate((layout.rotation * Math.PI) / 180)
        ctx.translate(-(layout.x + layout.w / 2), -(layout.y + layout.h / 2))

        // 이미지 테두리
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(layout.x - 10, layout.y - 10, layout.w + 20, layout.h + 20)

        // 이미지 그리기
        ctx.drawImage(img, layout.x, layout.y, layout.w, layout.h)

        ctx.restore()
      }

      // 브랜딩 요소 추가
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.font = "bold 24px Arial"
      ctx.fillText("My Virtual Fitting Room", 30, canvas.height - 60)
      ctx.font = "18px Arial"
      ctx.fillText("#VirtualFitting #StyleCheck", 30, canvas.height - 30)

      // 이미지 다운로드
      const link = document.createElement("a")
      link.download = "my-virtual-fitting.png"
      link.href = canvas.toDataURL()
      link.click()

      alert("이미지가 다운로드되었습니다. 인스타그램에 공유해보세요!")
    } catch (error) {
      console.error("이미지 생성 중 오류:", error)
      alert("이미지 생성 중 오류가 발생했습니다.")
    }
  }

  // 가상피팅 가능한 카테고리 체크 함수
  const isFittingAvailable = (category) => {
    const fittableCategories = ["Upper", "Lower", "Dress"]
    return fittableCategories.includes(category)
  }

  // 가상피팅 화면으로 이동하는 함수
  const goToFitting = (item) => {
    chrome.storage.local.set(
      {
        selectedGarment: {
          image: item.image,
          category: mapCategory(item.category),
        },
      },
      () => {
        // 확장프로그램 내에서 라우팅
        window.location.hash = "/fitting"
      }
    )
  }

  // 카테고리 매핑 함수
  const mapCategory = (category) => {
    const categoryMap = {
      상의: "Upper",
      하의: "Lower",
      원피스: "Dress",
      // 기존 카테고리는 그대로 유지
      Upper: "Upper",
      Lower: "Lower",
      Dress: "Dress",
    }
    return categoryMap[category] || category
  }

  // 가상피팅 실행 함수
  const handleTryOn = async (item) => {
    if (!item.image) {
      alert("상품 이미지를 찾을 수 없습니다.")
      return
    }

    // 사용자 이미지 확인
    chrome.storage.local.get(["tempUserImage"], async (result) => {
      if (!result.tempUserImage) {
        alert("먼저 프로필에서 본인 사진을 등록해주세요!")
        return
      }

      try {
        // 로딩 상태 표시 (CSS로 구현 필요)
        const itemElement = document.querySelector(`[data-item-id="${item.id}"]`)
        if (itemElement) {
          itemElement.classList.add(styles.loading)
        }

        // FitDiT 사용 가능 여부 확인
        const response = await chrome.storage.local.get(["fitditCallCount"])
        const count = response.fitditCallCount || 0
        let result

        if (count < 50) {
          try {
            result = await tryOnWithFitDiT(result.tempUserImage, item.image, mapCategory(item.category))
            // 성공적인 호출 시 카운트 증가
            chrome.storage.local.set({ fitditCallCount: count + 1 })
          } catch (error) {
            console.log("FitDiT 처리 실패, Leffa로 전환:", error)
            result = await tryOnWithLeffa(result.tempUserImage, item.image, mapCategory(item.category))
          }
        } else {
          alert("일일 할당량을 초과하여 가벼운 모델로 전환됩니다.")
          result = await tryOnWithLeffa(result.tempUserImage, item.image, mapCategory(item.category))
        }

        if (result) {
          // 결과 저장
          chrome.storage.local.get(["fittingResults"], (data) => {
            const currentResults = data.fittingResults || {}
            const newResults = {
              ...currentResults,
              [item.image]: result,
            }
            chrome.storage.local.set({ fittingResults: newResults })
          })
        }
      } catch (error) {
        console.error("가상 착용 실패:", error)
        alert(`가상 착용 중 오류가 발생했습니다: ${error.message || "알 수 없는 오류"}`)
      } finally {
        // 로딩 상태 제거
        const itemElement = document.querySelector(`[data-item-id="${item.id}"]`)
        if (itemElement) {
          itemElement.classList.remove(styles.loading)
        }
      }
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <h2 className={styles.title}>가상 피팅룸</h2>
          <span className={styles.count}>총 {cartItems.length}개</span>
        </div>
        <div className={styles.headerActions}>
          <button onClick={() => setShowMoodboard(true)} className={styles.moodboardButton}>
            코디북 만들기
          </button>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className={styles.emptyCart}>
          <p className={styles.emptyText}>장바구니가 비어있습니다</p>
          <p className={styles.emptyHint}>가상피팅 후 마음에 드는 상품을 담아보세요</p>
        </div>
      ) : (
        <>
          <div className={styles.controls}>
            <div className={styles.selectControls}>
              <div className={styles.selectAllContainer}>
                <input type="checkbox" id="selectAll" checked={isAllSelected} onChange={() => toggleSelectAll(!isAllSelected)} className={styles.checkbox} />
                <label htmlFor="selectAll" className={styles.selectAllText}>
                  전체 선택
                </label>
              </div>
            </div>
            <div className={styles.totalPrice}>합계: {calculateTotalPrice()}</div>
          </div>

          {showMoodboard && <Moodboard items={cartItems} onClose={() => setShowMoodboard(false)} />}

          <div className={styles.groupedItems}>
            {Object.entries(groupedItems).map(([mall, brands]) => (
              <div key={mall} className={styles.mallGroup}>
                <h2 className={styles.mallTitle}>{mall}</h2>
                {Object.entries(brands).map(([brand, items]) => (
                  <div key={brand} className={styles.brandGroup}>
                    <h3 className={styles.brandTitle}>{brand}</h3>
                    <div className={styles.grid}>
                      {items.map((item, index) => {
                        const fittingImage = getFittingImage(item.image)
                        return (
                          <div key={index} className={styles.card}>
                            <div className={styles.checkboxWrapper}>
                              <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => toggleSelectItem(item.id)} className={styles.checkbox} />
                            </div>
                            <div className={styles.imageSection}>
                              <div className={styles.imageWrapper}>
                                <img src={item.image} alt={item.name} className={styles.productImage} />
                              </div>
                              <div className={styles.imageWrapper}>
                                {isFittingAvailable(item.category) ? (
                                  fittingImage ? (
                                    <img src={fittingImage} alt="가상 착용 결과" className={styles.fittingImage} />
                                  ) : (
                                    <div className={styles.noFitting}>
                                      <span>
                                        가상피팅 없이 <br />
                                        장바구니에 <br />
                                        담은 상품입니다
                                      </span>
                                    </div>
                                  )
                                ) : (
                                  <div className={styles.notAvailable}>
                                    <span>
                                      가상피팅이 <br /> 불가능한 상품입니다
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className={styles.infoSection}>
                              <div className={styles.productInfo}>
                                <h4 className={styles.productName} title={item.name}>
                                  {item.name}
                                </h4>
                                <div className={styles.bottomRow}>
                                  <p className={styles.productPrice}>{item.price}</p>
                                  <div className={styles.actions}>
                                    <button onClick={() => openProductPage(item.url)} className={styles.buyButton}>
                                      구매하기
                                    </button>
                                    <button onClick={() => removeFromCart(item)} className={styles.deleteButton}>
                                      삭제
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Cart
