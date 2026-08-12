import { supabase } from "./supabase.js";

// =====================
// 注册
// =====================

window.register = async () => {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let confirmPassword = document.getElementById("confirmPassword").value;

    if(password !== confirmPassword){
        alert("两次输入的密码不一致");
        return;
    }

    if(password.length < 6){
        alert("密码至少6位");
        return;
    }

    const {data, error} = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if(error){
        alert(error.message);
    }
    else{
        alert("注册成功！请前往邮箱查收确认邮件，点击链接激活账号后再登录");
        location.href="index.html";
    }
}

// =====================
// 登录
// =====================

window.login = async function(){
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    const {data,error} = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if(error){
        alert(error.message);
    }
    else{
        const { data: profileData } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", data.user.id)
            .maybeSingle();

        if(profileData){
            location.href = "card.html";
        } else {
            location.href = "profile.html";
        }
    }
}

// =====================
// 保存电子名片资料
// =====================

window.saveProfile = async function(){
    const { data: userData } = await supabase.auth.getUser();

    if(!userData.user){
        alert("请先登录");
        location.href="index.html";
        return;
    }

    let avatarUrl = "";
    let honorImageUrl = "";
    
    const honorFileInput = document.getElementById("honor_image");
    if(honorFileInput && honorFileInput.files && honorFileInput.files[0]){
        const file = honorFileInput.files[0];
        if(file.size > 2 * 1024 * 1024){
            alert("荣誉图片太大，请选择 2MB 以内的图片");
            return;
        }
        honorImageUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }
    
    const fileInput = document.getElementById("avatar");
    if(fileInput.files && fileInput.files[0]){
        const file = fileInput.files[0];
        if(file.size > 2 * 1024 * 1024){
            alert("图片太大，请选择 2MB 以内的图片");
            return;
        }
        avatarUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    let profile = {
        id: userData.user.id,
        name: document.getElementById("name").value,
        job: document.getElementById("job").value,
        intro: document.getElementById("intro").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        github: document.getElementById("github").value,
        honor_text: document.getElementById("honor_text").value,
    };

    if(avatarUrl){
        profile.avatar = avatarUrl;
    }
    if(honorImageUrl){
        profile.honor_image = honorImageUrl;
    }

    const { error } = await supabase
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

window.clearProfile = function(){
    if(!confirm("确定要清空所有信息吗？")){
        return;
    }
    document.getElementById("name").value = "";
    document.getElementById("job").value = "";
    document.getElementById("intro").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("email").value = "";
    document.getElementById("github").value = "";
    document.getElementById("honor_text").value = "";
    document.getElementById("honor_image").value = "";
    document.getElementById("honorFileName").textContent = "未选择文件";
    document.getElementById("avatar").value = "";
    document.getElementById("fileName").textContent = "未选择文件";
}


window.updateFileName = function(input, nameId){
    const nameSpan = document.getElementById(nameId || "fileName");
    if(input.files && input.files[0]){
        nameSpan.textContent = input.files[0].name;
        nameSpan.style.color = "#333";
    } else {
        nameSpan.textContent = "未选择文件";
        nameSpan.style.color = "#888";
    }
}