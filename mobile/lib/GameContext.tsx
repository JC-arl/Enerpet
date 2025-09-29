import React, { createContext, useContext, useState } from "react";

type GameContextType = {
  level: number;
  exp: number;
  maxExp: number;
  leafPoints: number;
  cash: number;
  setLevel: (level: number) => void;
  setExp: (exp: number) => void;
  setMaxExp: (maxExp: number) => void;   // ✅ 추가
  setLeafPoints: (points: number) => void;
  setCash: (cash: number) => void;
};

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [maxExp, setMaxExp] = useState(500);
  const [leafPoints, setLeafPoints] = useState(1200);
  const [cash, setCash] = useState(5600);

  return (
    <GameContext.Provider
      value={{
        level,
        exp,
        maxExp,
        leafPoints,
        cash,
        setLevel,
        setExp,
        setMaxExp,   // ✅ 컨텍스트에 포함
        setLeafPoints,
        setCash,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
};
