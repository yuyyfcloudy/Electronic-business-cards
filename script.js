function saveCard(){



let card={


name:
document.getElementById("name").value,


job:
document.getElementById("job").value,


intro:
document.getElementById("intro").value,


phone:
document.getElementById("phone").value,


email:
document.getElementById("email").value,


github:
document.getElementById("github").value,


avatar:
document.getElementById("avatar").value



};



localStorage.setItem(

"card",

JSON.stringify(card)

);



alert("创建成功");



location.href="card.html";


}