import React, { useState, useRef, useEffect } from "react"
import styles from "./Moodboard.module.css"

const SLOT_TYPES = {
  TOP: "top",
  BOTTOM: "bottom",
  SHOES: "shoes",
  ACCESSORY: "accessory",
}

const STORAGE_KEY = "moodboardSlots" // 스토리지 키 상수

const Moodboard = ({ items, onClose }) => {
  const [slots, setSlots] = useState({
    [SLOT_TYPES.TOP]: null,
    [SLOT_TYPES.BOTTOM]: null,
    [SLOT_TYPES.SHOES]: null,
    [SLOT_TYPES.ACCESSORY]: null,
  })

  const [selectedType, setSelectedType] = useState(null)
  const moodboardRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)

  // 초기 로드시 저장된 슬롯 데이터 불러오기
  useEffect(() => {
    const loadSavedSlots = async () => {
      try {
        // chrome.storage.local에서 저장된 무드보드 데이터 로드
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          if (result[STORAGE_KEY]) {
            // 저장된 데이터가 있으면 상태 업데이트
            setSlots(result[STORAGE_KEY])
          }
          setIsLoading(false)
        })
      } catch (error) {
        console.error("저장된 무드보드 데이터를 불러오는 중 오류 발생:", error)
        setIsLoading(false)
      }
    }

    loadSavedSlots()
  }, [])

  // 슬롯 상태가 변경될 때마다 chrome.storage.local에 저장
  useEffect(() => {
    // 초기 로딩 중에는 저장하지 않음
    if (isLoading) return

    // 슬롯 상태를 chrome.storage.local에 저장
    chrome.storage.local.set({ [STORAGE_KEY]: slots }, () => {
      console.log("무드보드 상태가 저장되었습니다.")
    })
  }, [slots, isLoading])

  const handleSlotClick = (type) => {
    setSelectedType(type)
  }

  const handleItemSelect = (item) => {
    setSlots((prev) => ({
      ...prev,
      [selectedType]: item,
    }))
    setSelectedType(null)
  }

  const clearSlot = (type, e) => {
    e.stopPropagation() // 슬롯 클릭 이벤트 전파 방지
    setSlots((prev) => ({
      ...prev,
      [type]: null,
    }))
  }

  const clearAllSlots = () => {
    setSlots({
      [SLOT_TYPES.TOP]: null,
      [SLOT_TYPES.BOTTOM]: null,
      [SLOT_TYPES.SHOES]: null,
      [SLOT_TYPES.ACCESSORY]: null,
    })
  }

  const downloadMoodboard = async () => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    canvas.width = 1080
    canvas.height = 1080

    try {
      // 배경 설정
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // DOM에 렌더링된 슬롯과 동일한 순서로 그리기
      const slotOrder = [
        { type: SLOT_TYPES.TOP, position: { x: 40, y: 40, w: 480, h: 480 } },
        { type: SLOT_TYPES.ACCESSORY, position: { x: 560, y: 40, w: 480, h: 480 } },
        { type: SLOT_TYPES.BOTTOM, position: { x: 40, y: 560, w: 480, h: 480 } },
        { type: SLOT_TYPES.SHOES, position: { x: 560, y: 560, w: 480, h: 480 } },
      ]

      // 각 슬롯을 순서대로 그림
      for (const slotInfo of slotOrder) {
        const { type, position } = slotInfo
        const item = slots[type]

        // 슬롯 배경
        ctx.fillStyle = "#f8f8f8"
        ctx.fillRect(position.x, position.y, position.w, position.h)
        if (item) {
          // 이미지가 있는 경우
          const img = await loadImage(item.image)

          // 이미지 비율 계산
          const imgWidth = img.width
          const imgHeight = img.height
          const imgRatio = imgWidth / imgHeight
          const slotRatio = position.w / position.h

          let drawWidth, drawHeight, offsetX, offsetY

          // 이미지 비율에 따라 적절히 크기 조정
          if (imgRatio > slotRatio) {
            drawHeight = position.h
            drawWidth = imgWidth * (position.h / imgHeight)
            offsetX = position.x + (position.w - drawWidth) / 2
            offsetY = position.y
          } else {
            drawWidth = position.w
            drawHeight = imgHeight * (position.w / imgWidth)
            offsetX = position.x
            offsetY = position.y + (position.h - drawHeight) / 2
          }

          // 이미지 그리기 (슬롯 영역 내에서 클리핑)
          ctx.save()
          ctx.beginPath()
          ctx.rect(position.x, position.y, position.w, position.h)
          ctx.clip()
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
          ctx.restore()
        } else {
          // 빈 슬롯인 경우 안내 메시지 표시
          ctx.fillStyle = "#9ca3af"
          ctx.font = "16px Arial"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText("원하는 상품을 담아주세요", position.x + position.w / 2, position.y + position.h / 2)
        }
      }

      // 이미지 URL 생성
      const imageUrl = canvas.toDataURL()

      // 다운로드 링크 생성
      const link = document.createElement("a")
      link.download = "my-moodboard.png"
      link.href = imageUrl
      link.click()
    } catch (error) {
      console.error("무드보드 생성 중 오류:", error)
      alert("무드보드 생성 중 오류가 발생했습니다.")
    }
  }

  if (isLoading) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.loading}>무드보드 불러오는 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>나만의 코디북 만들기</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.moodboardContainer} ref={moodboardRef}>
          {/* TOP과 ACCESSORY가 첫 번째 줄, BOTTOM과 SHOES가 두 번째 줄로 렌더링되도록 순서 보장 */}
          <div
            key={SLOT_TYPES.TOP}
            className={`${styles.slot} ${selectedType === SLOT_TYPES.TOP ? styles.selected : ""}`}
            onClick={() => handleSlotClick(SLOT_TYPES.TOP)}
            data-slot-type={SLOT_TYPES.TOP}
          >
            {slots[SLOT_TYPES.TOP] ? (
              <>
                <img src={slots[SLOT_TYPES.TOP].image} alt={slots[SLOT_TYPES.TOP].name} />
                <button className={styles.removeButton} onClick={(e) => clearSlot(SLOT_TYPES.TOP, e)} title="제거">
                  ×
                </button>
              </>
            ) : (
              <div className={styles.emptySlot}>
                <p>상품을 담아주세요</p>
              </div>
            )}
          </div>

          <div
            key={SLOT_TYPES.ACCESSORY}
            className={`${styles.slot} ${selectedType === SLOT_TYPES.ACCESSORY ? styles.selected : ""}`}
            onClick={() => handleSlotClick(SLOT_TYPES.ACCESSORY)}
            data-slot-type={SLOT_TYPES.ACCESSORY}
          >
            {slots[SLOT_TYPES.ACCESSORY] ? (
              <>
                <img src={slots[SLOT_TYPES.ACCESSORY].image} alt={slots[SLOT_TYPES.ACCESSORY].name} />
                <button className={styles.removeButton} onClick={(e) => clearSlot(SLOT_TYPES.ACCESSORY, e)} title="제거">
                  ×
                </button>
              </>
            ) : (
              <div className={styles.emptySlot}>
                <p>상품을 담아주세요</p>
              </div>
            )}
          </div>

          <div
            key={SLOT_TYPES.BOTTOM}
            className={`${styles.slot} ${selectedType === SLOT_TYPES.BOTTOM ? styles.selected : ""}`}
            onClick={() => handleSlotClick(SLOT_TYPES.BOTTOM)}
            data-slot-type={SLOT_TYPES.BOTTOM}
          >
            {slots[SLOT_TYPES.BOTTOM] ? (
              <>
                <img src={slots[SLOT_TYPES.BOTTOM].image} alt={slots[SLOT_TYPES.BOTTOM].name} />
                <button className={styles.removeButton} onClick={(e) => clearSlot(SLOT_TYPES.BOTTOM, e)} title="제거">
                  ×
                </button>
              </>
            ) : (
              <div className={styles.emptySlot}>
                <p>상품을 담아주세요</p>
              </div>
            )}
          </div>

          <div
            key={SLOT_TYPES.SHOES}
            className={`${styles.slot} ${selectedType === SLOT_TYPES.SHOES ? styles.selected : ""}`}
            onClick={() => handleSlotClick(SLOT_TYPES.SHOES)}
            data-slot-type={SLOT_TYPES.SHOES}
          >
            {slots[SLOT_TYPES.SHOES] ? (
              <>
                <img src={slots[SLOT_TYPES.SHOES].image} alt={slots[SLOT_TYPES.SHOES].name} />
                <button className={styles.removeButton} onClick={(e) => clearSlot(SLOT_TYPES.SHOES, e)} title="제거">
                  ×
                </button>
              </>
            ) : (
              <div className={styles.emptySlot}>
                <p>상품을 담아주세요</p>
              </div>
            )}
          </div>
        </div>

        {selectedType && (
          <div className={styles.itemSelector}>
            <h3>아이템 선택</h3>
            <div className={styles.itemGrid}>
              {items.map((item) => (
                <div key={item.id} className={styles.itemChoice} onClick={() => handleItemSelect(item)}>
                  <img src={item.image} alt={item.name} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={clearAllSlots} className={styles.clearButton} disabled={!Object.values(slots).some((slot) => slot)}>
            전체 초기화
          </button>
          <button onClick={downloadMoodboard} className={styles.downloadButton} disabled={!Object.values(slots).some((slot) => slot)}>
            다운로드
          </button>
        </div>
      </div>
    </div>
  )
}

export default Moodboard

// 이미지 로드 헬퍼 함수
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
