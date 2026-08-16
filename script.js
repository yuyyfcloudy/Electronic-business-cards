import { supabase } from "./supabase.js";

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
        location.href="login.html";
    }
}

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

window.saveProfile = async function(){
    const { data: userData } = await supabase.auth.getUser();

    if(!userData.user){
        alert("请先登录");
        location.href="login.html";
        return;
    }

        // 收集隐私设置
    const hiddenChecks = document.querySelectorAll('.hide-check:checked');
    const hiddenFields = Array.from(hiddenChecks).map(cb => cb.dataset.field);
    const isHidden = document.getElementById("hideAllCard").checked;

    let avatarUrl = "";
    let honorImageUrls = [];

    const honorFileInput = document.getElementById("honor_image");
    if(honorFileInput && honorFileInput.files && honorFileInput.files.length > 0){
        const files = Array.from(honorFileInput.files).slice(0, 6);
        for(const file of files){
            if(file.size > 2 * 1024 * 1024){
                alert("图片「" + file.name + "」超过 2MB，已跳过");
                continue;
            }
            const url = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
            honorImageUrls.push(url);
        }
    }

    const fileInput = document.getElementById("avatar");
    if(fileInput.files && fileInput.files[0]){
        const file = fileInput.files[0];
        if(file.size > 2 * 1024 * 1024){
            alert("头像图片太大，请选择 2MB 以内的图片");
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
        hidden_fields: hiddenFields,
        is_hidden: isHidden
    };

    if(avatarUrl){
        profile.avatar = avatarUrl;
    }
    if(honorImageUrls.length > 0){
        profile.honor_image = JSON.stringify(honorImageUrls);
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
    document.getElementById("honorFileName").textContent = "未选择文件（最多6张）";
    document.getElementById("honorFileName").style.color = "#888";
    document.getElementById("avatar").value = "";
    document.getElementById("fileName").textContent = "未选择文件";
}

window.updateFileName = function(input, nameId){
    const nameSpan = document.getElementById(nameId || "fileName");
    if(input.files && input.files.length > 0){
        if(input.files.length === 1){
            nameSpan.textContent = input.files[0].name;
        } else {
            nameSpan.textContent = "已选择 " + input.files.length + " 个文件";
        }
        nameSpan.style.color = "#333";
    } else {
        nameSpan.textContent = nameId === "honorFileName" ? "未选择文件（最多6张）" : "未选择文件";
        nameSpan.style.color = "#888";
    }
}

/* =====================
   忘记密码 — 验证码重置
   ===================== */

let resetCountdown = 0;
let resetTimer = null;

window.openForgotModal = function() {
    document.getElementById("forgotModal").style.display = "flex";
    document.getElementById("resetEmail").value = "";
    document.getElementById("resetCode").value = "";
    document.getElementById("resetNewPwd").value = "";
    document.getElementById("resetConfirmPwd").value = "";
    resetCountdown = 0;
    updateResetBtnState();
};

window.closeForgotModal = function() {
    document.getElementById("forgotModal").style.display = "none";
    if(resetTimer) {
        clearInterval(resetTimer);
        resetTimer = null;
    }
};

function updateResetBtnState() {
    const btn = document.getElementById("sendCodeBtn");
    if(!btn) return;
    if(resetCountdown > 0) {
        btn.textContent = resetCountdown + "s 后重发";
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
        btn.style.filter = "grayscale(0.6)";
    } else {
        btn.textContent = "发送验证码";
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        btn.style.filter = "none";
    }
}

window.sendResetCode = async function() {
    const email = document.getElementById("resetEmail").value.trim();
    if(!email) {
        alert("请输入邮箱地址");
        return;
    }

    const btn = document.getElementById("sendCodeBtn");
    btn.textContent = "发送中...";
    btn.disabled = true;

    const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
            shouldCreateUser: false   // 禁止创建新用户，只有已注册用户才能收到验证码
        }
    });

    if(error) {
        alert("发送失败: " + error.message);
        updateResetBtnState();
        return;
    }

    alert("验证码已发送至邮箱，请查收（有效期约 1 分钟）");
    resetCountdown = 60;
    updateResetBtnState();

    resetTimer = setInterval(() => {
        resetCountdown--;
        updateResetBtnState();
        if(resetCountdown <= 0) {
            clearInterval(resetTimer);
            resetTimer = null;
        }
    }, 1000);
};

window.submitResetPassword = async function() {
    const email = document.getElementById("resetEmail").value.trim();
    const code = document.getElementById("resetCode").value.trim();
    const newPwd = document.getElementById("resetNewPwd").value;
    const confirmPwd = document.getElementById("resetConfirmPwd").value;

    if(!email || !code || !newPwd || !confirmPwd) {
        alert("请填写所有字段");
        return;
    }
    if(newPwd !== confirmPwd) {
        alert("两次输入的密码不一致");
        return;
    }
    if(newPwd.length < 6) {
        alert("密码至少6位");
        return;
    }

    // 1. 验证 OTP 验证码
    const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: 'email'
    });

    if(verifyError) {
        alert("验证码错误或已过期，请重新获取");
        return;
    }

    // 2. 验证通过后，直接修改密码
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPwd
    });

    if(updateError) {
        alert("密码修改失败: " + updateError.message);
        return;
    }

    // 3. 修改成功后清除登录态，让用户用新密码重新登录
    await supabase.auth.signOut();

    alert("✅ 密码重置成功！请使用新密码登录");
    closeForgotModal();
};