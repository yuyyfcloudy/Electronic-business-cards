let btn=
document.getElementById("themeBtn");



btn.onclick=function(){


document.body.classList.toggle("dark");



if(
document.body.classList.contains("dark")
)

{

btn.innerHTML="☀️";

}

else

{

btn.innerHTML="🌙";

}


}