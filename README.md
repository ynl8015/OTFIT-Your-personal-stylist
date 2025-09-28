![Image](https://github.com/user-attachments/assets/9d61f0c8-5657-487d-bec6-b7e75300bfd8)

## OTFIT 서비스 소개

<br> <div align="center"> <strong>피팅룸만이 답이 아니다!<br> AI 기반 가상 피팅으로, 내 사진 속 새로운 스타일을 경험하세요</strong> <br><br> 설치하기 : https://chromewebstore.google.com/detail/otfit/cfdepeimbnkpaebbcfebmdgfnfanlckp </div> <br>

## 서비스 기획배경
<div align="center"> 온라인 쇼핑은 편리하지만, <br> “나한테 어울릴까?” “사이즈가 맞을까?” <br> 이런 불안 때문에 주저하는 경우가 많습니다. <br><br> <img width="600" height="200" alt="Image" src="https://github.com/user-attachments/assets/a7f99da3-9129-4fd3-97d0-e64ebc2b49e7" /> <br><br> 특히 신체적, 체형적 제약이 있는 경우, <br> 해외직구를 하는 경우 <br> 옷을 직접 입어보기는 더더욱 어렵습니다. <br><br> <strong>그래서,</strong> <br><br> 누구나 자유롭게, 온라인에서도 <br> 안전하고 즐겁게 패션을 시도할 수 있도록 – <br><br> <strong>AI 기반 가상 피팅 Chrome Extension, OTFIT 입니다. </strong> </div>


## OTFIT에 사용된 기술들

### AI (Leffa / FitDiT)  
Leffa와 FitDiT는 여러 VTON 모델 비교에서 **낮은 FID를 기록하며 우수한 품질**을 보여주었습니다.  

빠른 피팅 경험을 선호하는 사용자 특성에 적합하다고 판단했고,  

그중 **Leffa가 가장 빠른 추론 속도**를 보여 메인으로 사용하며,  

**FitDiT은 보조 모델**로 세팅했습니다.  

<sub>※ FID(Fréchet Inception Distance): 생성된 이미지가 실제 이미지와 얼마나 유사한지를 평가하는 대표적인 지표. 값이 **낮을수록** 실제와 더 유사함을 의미합니다.</sub>

### Tech Stack (without Backend)
부하를 줄이기 위해 백엔드를 없애고, 

Hugging Face 모델 API 연결로 라이트함을 가져갔습니다. 

| Category             | Stack                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Common**           | ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square\&logo=javascript\&logoColor=black) ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat-square\&logo=eslint\&logoColor=white)                                                                                                                                                                                                                 |
| **Frontend**         | ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square\&logo=react\&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square\&logo=vite\&logoColor=white) ![CSS Modules](https://img.shields.io/badge/CSS_Modules-000000?style=flat-square\&logo=css3\&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square\&logo=tailwind-css\&logoColor=white) |
| **Chrome Extension** | ![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-4285F4?style=flat-square\&logo=google-chrome\&logoColor=white) ![Manifest V3](https://img.shields.io/badge/Manifest_V3-4285F4?style=flat-square\&logo=google-chrome\&logoColor=white)                                                                                                                                                                                 |
| **AI/ML**            | ![FitDiT](https://img.shields.io/badge/FitDiT-FF6B6B?style=flat-square\&logo=huggingface\&logoColor=white) ![Leffa](https://img.shields.io/badge/Leffa-FF6B6B?style=flat-square\&logo=huggingface\&logoColor=white) ![Gradio](https://img.shields.io/badge/Gradio-FF6B6B?style=flat-square\&logo=huggingface\&logoColor=white)                                                                                                          |
| **State Management** | ![React Hooks](https://img.shields.io/badge/React_Hooks-61DAFB?style=flat-square\&logo=react\&logoColor=black) ![Chrome Storage](https://img.shields.io/badge/Chrome_Storage-4285F4?style=flat-square\&logo=google-chrome\&logoColor=white)                                                                                                                                                                                             |
| **Build Tools**      | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square\&logo=vite\&logoColor=white) ![npm](https://img.shields.io/badge/npm-CB3837?style=flat-square\&logo=npm\&logoColor=white)                                                                                                                                                                                                                                            |  


## OTFIT's 주목 포인드
### 1️⃣ Element Picker 구현으로, 더 빠른 상품 선택
- 상품을 선택하면(호버) 상품 정보가 바로 추출이 됩니다. 

  이미지 뿐 아니라, 상품정보와, 가격 URL까지. 

  무신사, 지그재그, SSF외 다양한 쇼핑몰을 지원할 수 있도록 HTML 구조를 분석

  가장 효과적인 셀렉터 알고리즘을 만들었습니다.

![Image](https://github.com/user-attachments/assets/1cba3b33-a593-40a6-8510-3231e6ce0e41)


### 2️⃣ 얕은 뎁스, 라이트한 모델
- 쇼핑에 방해되지 않도록,

  옷 선택 -> 사람 선택 -> 입혀보기

  가장 가시적인 플로우만을 남겨놓았습니다.


### 3️⃣ 에러 처리
- Leffa 모델과 함께, FitDit 모델을 함께 사용할 수 있는 하이브리드 설계로
  
  혹시 모를 API 장애에 대비했습니다
<br>   에러 예시 : 모델 서버 다운, 일일 호출량 초과, 네트워크 타임아웃


### 4️⃣ 통합 장바구니
- 거의 모든 쇼핑몰에서 사용 가능하도록 통합 상품 데이터 구조를 확보

![Image](https://github.com/user-attachments/assets/6bcc37f9-d56d-4f2a-a09b-e392589ab53a)

### 5️⃣ 빠른 속도의 피팅

- **FitDiT**은 1024×768 해상도 이미지 기준으로 **4.57초** 만에 피팅 결과를 생성하며,  
  기존 VTON 모델 대비 **27% 빠른 처리 속도**를 달성했습니다.
  
- **Leffa** 역시 A100 GPU 환경에서 **약 6초 내외**의 추론 시간이 보고되어,  
  실사용 환경에서 충분히 빠른 경험을 제공할 수 있습니다.

![Image](https://github.com/user-attachments/assets/99921a71-a29c-40fe-a6ce-345f77922d34)

  
### 8️⃣ 보안 & 프라이버시 고려
사용자의 개인 사진 데이터는 외부 서버에 저장하지 않고,

Hugging Face API inference 결과만 즉시 반환되도록 설계하여 데이터 보안을 강화했습니다.

## 👩‍💻 팀 멤버

## 👩‍💻 팀 멤버

| 오은지 | 이유나 |
|--------|--------|
| <div align="center"><img width="120" height="120" alt="Eunji Avatar" src="https://github.com/user-attachments/assets/4486b25a-690b-4a87-a760-ea9b38681426" /></div> | <div align="center"><img width="120" height="120" alt="Yuna Avatar" src="https://github.com/user-attachments/assets/e0d29aa6-3e37-49b9-b368-2f742996f3c5" /></div> |
| <div align="center"><img src="https://img.shields.io/badge/FE-808080?style=for-the-badge&logo=react&logoColor=white" /></div> | <div align="center"><img src="https://img.shields.io/badge/FE-808080?style=for-the-badge&logo=react&logoColor=white" /></div> |
| <div align="center">[github.com/oeg9176](https://github.com/oeg9176)</div> | <div align="center">[github.com/ynl8015](https://github.com/ynl8015)</div> |
