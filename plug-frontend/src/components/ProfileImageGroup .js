import React, { useMemo } from "react";
import Image1 from "../assets/img/1.jpg";
import Image2 from "../assets/img/2.jpg";
import Image3 from "../assets/img/3.jpg";
import Image4 from "../assets/img/4.jpg";
import Image5 from "../assets/img/5.jpg";
import Image6 from "../assets/img/6.jpg";
import Image7 from "../assets/img/7.jpg";
import Image8 from "../assets/img/8.jpg";
import Image9 from "../assets/img/9.jpg";
import Image10 from "../assets/img/10.jpg";
import { numberToKMG } from "../utils/commons";

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const ProfileImageGroup = ({ followersCount }) => {
  const images = [
    Image1,
    Image2,
    Image3,
    Image4,
    Image5,
    Image6,
    Image7,
    Image8,
    Image9,
    Image10,
  ];

  const shuffledImages = useMemo(() => shuffleArray(images), []);
  const followersSlice = useMemo(() => {
    if (followersCount > 5) {
      return 5;
    }
    return followersCount;
  }, [followersCount]);
  console.log("followersCount:", followersCount);
  
  return (
    <div className="flex">
      {followersCount ?
        shuffledImages.slice(0, followersSlice).map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`profile-${index}`}
            className={`w-6 h-6 rounded-full border-2 border-white object-cover shadow-md -ml-3 ${
              index === 0 ? "z-10 ml-0" : `z-${10 - index}`
            }`}
            style={{ position: "relative" }}
            //   className="w-6 h-6 rounded-full border-2 border-white shadow-md object-cover"
          />
        )):""}
      {followersCount ? (
        <span className="ml-2 text-sm font-semibold text-white">
          {numberToKMG(followersCount)}
        </span>
      ):""}
    </div>
  );
};

export default ProfileImageGroup;
