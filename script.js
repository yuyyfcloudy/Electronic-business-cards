import { supabase } from "./supabase.js";



// =====================
// 注册
// =====================

window.register = async () => {

    let email =
    document.getElementById("email").value;


    let password =
    document.getElementById("password").value;



    const {data,error} =
    await supabase.auth.signUp({

        email: email,

        password: password

    });



    if(error){

        alert(error.message);

    }
    else{

        alert("注册成功，请登录");

        location.href="index.html";

    }

}





// =====================
// 登录
// =====================

window.login = async function(){


    let email =
    document.getElementById("email").value;


    let password =
    document.getElementById("password").value;



    const {data,error} =
    await supabase.auth.signInWithPassword({

        email: email,

        password: password

    });



    if(error){

        alert(error.message);

    }
    else{

        alert("登录成功");

        location.href="profile.html";

    }

}





// =====================
// 保存电子名片资料
// =====================

window.saveProfile = async function(){



    // 获取当前用户

    const {

        data:userData

    } = await supabase.auth.getUser();




    if(!userData.user){

        alert("请先登录");

        location.href="index.html";

        return;

    }




    let profile = {


        id:
        userData.user.id,


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




    const {

        error

    } = await supabase

    .from("profiles")

    .upsert(profile);




    if(error){


        alert(error.message);


        console.log(error);


    }

    else{


        alert("保存成功");


        location.href="card.html";


    }


}