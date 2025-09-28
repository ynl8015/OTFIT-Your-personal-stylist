import React, { useState } from "react"
import VirtualFitting from "./components/VirtualFitting"
import Cart from "./components/Cart"
import styles from "./App.module.css"
import TermsModal from './components/TermsModal'

const App = () => {
  const [activeTab, setActiveTab] = useState("fitting")
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>OTFIT</h1>
        <p className={styles.subtitle}>모두가 가능한 패션</p>
      </header>

      <nav className={styles.nav}>
        {/* 움직이는 배경 슬라이더 */}
        <div
          className={styles.tabSlider}
          style={{
            transform: activeTab === "fitting" ? "translateX(0)" : "translateX(100%)",
          }}
        ></div>

        {/* 탭 버튼들 */}
        <button className={`${styles.tab} ${activeTab === "fitting" ? styles.tabActive : styles.tabInactive}`} onClick={() => setActiveTab("fitting")}>
          가상피팅
        </button>
        <button className={`${styles.tab} ${activeTab === "cart" ? styles.tabActive : styles.tabInactive}`} onClick={() => setActiveTab("cart")}>
          장바구니
        </button>
      </nav>

      <main className={styles.main}>
        <div className={styles.content}>{activeTab === "fitting" ? <VirtualFitting /> : <Cart />}</div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.credits}>
          <p className={styles.copyright}>
            © 2025 OTFIT
            <button 
              onClick={() => setIsTermsModalOpen(true)}
              className={styles.termsButton}
            >
              이용약관
            </button>
          </p>
          <div className={styles.poweredBy}>
            <span>Powered by</span>
            <a 
              href="https://huggingface.co/spaces/BoyuanJiang/FitDiT" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.creditLink}
            >
              FitDiT (CC BY-NC-SA 4.0)
            </a>
            <span className={styles.creditSeparator}>•</span>
            <a 
              href="https://huggingface.co/spaces/franciszzj/Leffa" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.creditLink}
            >
              Leffa
            </a>
          </div>
        </div>
      </footer>

      <TermsModal 
        isOpen={isTermsModalOpen} 
        onClose={() => setIsTermsModalOpen(false)} 
      />
    </div>
  )
}

export default App
