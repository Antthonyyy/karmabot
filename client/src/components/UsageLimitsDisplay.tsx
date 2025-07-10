import React, { useEffect, useState } from "react";

type UsageData = {
  used: number;
  limit: number;
};

type Props = {
  feature: string;
};

const UsageLimitsDisplay: React.FC<Props> = ({ feature }) => {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch(`/api/usage/${feature}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!res.ok) throw new Error("Usage fetch failed");
        const data = await res.json();
        setUsage(data);
      } catch (err) {
        console.error("Ошибка при получении лимитов:", err);
      }
    };

    fetchUsage();
  }, [feature]);

  if (!usage) return null;

  return (
    <div className="bg-white shadow-md p-3 rounded-xl text-sm text-gray-800">
      <strong>Використання:</strong> {usage.used} /{" "}
      {usage.limit === -1 ? "∞" : usage.limit}
    </div>
  );
};

export default UsageLimitsDisplay;
