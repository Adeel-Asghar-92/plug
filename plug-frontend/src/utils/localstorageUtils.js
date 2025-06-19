
export const storeViewedItems = (id) => {
    let ids = JSON.parse(localStorage.getItem("viewedItems")) || [];
    if(ids.length >= 3) return;
   // Avoid duplicates
   if (!ids.includes(id)) {
     ids.push(id);
     localStorage.setItem("viewedItems", JSON.stringify(ids));
   }
 };
 export const getViewedItemsCount = () => {
    const ids = JSON.parse(localStorage.getItem("viewedItems")) || [];
    return ids.length;
  };
  