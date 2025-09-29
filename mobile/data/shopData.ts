// data/shopData.ts

export const shopData = {
  food: [
    { id: 1, name: "사과", desc: "먹이면 행복도가 조금 올라요.", price: "50 Leaf" },
    { id: 2, name: "친환경 채소", desc: "친환경 농산물! 행복도와 경험치 증가", price: "150 Leaf" },
    { id: 3, name: "프리미엄 사료", desc: "빠른 성장! 경험치 크게 증가", price: "500 Leaf" },
  ],
  toys: [
    { id: 4, name: "에코볼", desc: "재활용 소재 공. 즐겁게 놀아요.", price: "200 Leaf" },
    { id: 5, name: "태양광 막대기", desc: "밤에도 빛나는 친환경 장난감", price: "350 Leaf" },
  ],
  costume: [
    { id: 6, name: "친환경 티셔츠", desc: "펫에게 입히는 귀여운 옷", price: "700 Leaf" },
    { id: 7, name: "태양광 모자", desc: "햇빛을 받아 에너지 UP!", price: "1000 Leaf" },
  ],
  house: [
    { id: 8, name: "절전형 냉장고", desc: "전기세 절감 보너스 제공", price: "2000 Leaf" },
    { id: 9, name: "태양광 패널 지붕", desc: "에너지 충전 보너스", price: "3000 Leaf" },
  ],
  special: [
    { id: 10, name: "에코 부스트", desc: "다음 미션 보상 2배", price: "500 Leaf" },
    { id: 11, name: "탄소 절감 스티커", desc: "랭킹 점수 추가", price: "800 Leaf" },
  ],
};


export type ShopCategoryKey = keyof typeof shopData; // "boosters" | "consumables" | "premium"
