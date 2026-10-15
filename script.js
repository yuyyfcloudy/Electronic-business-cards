import { supabase } from "./supabase.js";

function pageFeedback(id, message, tone = "error") {
    const el = document.getElementById(id);
    if (!el) return false;
    el.textContent = message;
    el.dataset.tone = tone;
    return true;
}

function friendlyAuthError(error) {
    const message = String(error?.message || "");
    if (/invalid login credentials/i.test(message)) return "邮箱或密码不正确，请检查后重试。";
    if (/email not confirmed/i.test(message)) return "邮箱还未确认，请先查收确认邮件。";
    if (/user already registered/i.test(message)) return "这个邮箱已经注册过了，直接登录即可。";
    return message || "暂时无法完成操作，请稍后再试。";
}

window.register = async () => {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let confirmPassword = document.getElementById("confirmPassword").value;

    if(password !== confirmPassword){
        pageFeedback("registerFeedback", "两次输入的密码不一致。请重新确认密码。");
        return;
    }

    if(password.length < 6){
        pageFeedback("registerFeedback", "密码至少需要 6 位字符。");
        return;
    }

    pageFeedback("registerFeedback", "正在创建账号…", "pending");
    document.getElementById("registerSubmit")?.setAttribute("disabled", "true");

    const {data, error} = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if(error){
        pageFeedback("registerFeedback", friendlyAuthError(error));
        document.getElementById("registerSubmit")?.removeAttribute("disabled");
    }
    else{
        pageFeedback("registerFeedback", "注册成功！请查收邮箱确认账号。", "success");
        document.getElementById("registerSubmit")?.removeAttribute("disabled");
        location.href="index.html";
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
        if (!pageFeedback("loginFeedback", friendlyAuthError(error))) alert(friendlyAuthError(error));
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
        location.href="index.html";
        return;
    }

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
        if (!pageFeedback("profileFeedback", error.message || "保存失败，请稍后再试。")) alert(error.message);
        console.log(error);
    }
    else{
        pageFeedback("profileFeedback", "保存成功，正在打开你的名片…", "success");
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
/* -------------------------------------------------------------------------
   Interaction layer
   Small, tactile interactions shared by every page. This is intentionally
   independent from the Supabase code above: it only decorates existing DOM
   nodes and safely no-ops when a page does not contain them.
--------------------------------------------------------------------------- */
(function initInteractionLayer() {
    const finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const style = document.createElement("style");
    style.textContent = `
      .interaction-spotlight { position: relative; isolation: isolate; }
      .interaction-spotlight::after { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
        background: radial-gradient(280px circle at var(--pointer-x,50%) var(--pointer-y,50%), rgba(255,255,255,.12), transparent 68%);
        opacity: 0; transition: opacity .35s ease; }
      .interaction-spotlight:hover::after, .interaction-spotlight.is-pointed::after { opacity: 1; }
      .tilt-item { transform: perspective(900px) rotateX(var(--tilt-y,0deg)) rotateY(var(--tilt-x,0deg));
        transition: transform .45s cubic-bezier(.2,.8,.2,1), box-shadow .35s ease; will-change: transform; }\n      .tilt-item:hover { transform: perspective(900px) rotateX(var(--tilt-y,0deg)) rotateY(var(--tilt-x,0deg)) translateY(-7px); }
      .reveal-item { opacity: 0; transform: translateY(18px); transition: opacity .65s ease, transform .65s cubic-bezier(.2,.8,.2,1); }
      .reveal-item.is-visible { opacity: 1; transform: translateY(0); }
      .cursor-aura { position: fixed; left: 0; top: 0; width: 260px; height: 260px; border-radius: 50%; pointer-events: none; z-index: 9999;
        opacity: 0; mix-blend-mode: screen; background: radial-gradient(circle, rgba(255,255,255,.10), rgba(255,255,255,0) 68%);
        transform: translate(-50%,-50%); transition: opacity .3s ease; }
      body.has-cursor-aura .cursor-aura { opacity: 1; }
      .ui-ripple { position: absolute; width: 8px; height: 8px; border-radius: 50%; pointer-events:none;
        background: currentColor; opacity: .28; transform: translate(-50%,-50%) scale(0); animation: ui-ripple .55s ease-out forwards; }
      @keyframes ui-ripple { to { opacity: 0; transform: translate(-50%,-50%) scale(18); } }
      @media (prefers-reduced-motion: reduce) {
        .reveal-item { opacity: 1; transform: none; transition: none; }
        .tilt-item { transform: none !important; transition: none; }
        .cursor-aura { display: none; }
      }
    `;
    document.head.appendChild(style);

    const spotlightSelector = ".user-card, .login-box, .feature-item, .info-block, .sidebar-card, .contact-box, .box, .nav-brand";
    const tiltSelector = ".user-card, .login-box, .sidebar-card, .contact-box";

    document.querySelectorAll(spotlightSelector).forEach((el, index) => {
        el.classList.add("interaction-spotlight", "reveal-item");
        if (index < 4) el.style.transitionDelay = `${index * 55}ms`;
    });
    document.querySelectorAll(tiltSelector).forEach(el => el.classList.add("tilt-item"));

    if ("IntersectionObserver" in window && !reduceMotion) {
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
        }), { threshold: 0.12 });
        document.querySelectorAll(".reveal-item").forEach(el => observer.observe(el));
    } else {
        document.querySelectorAll(".reveal-item").forEach(el => el.classList.add("is-visible"));
    }

    if (finePointer && !reduceMotion && !document.body.classList.contains("editorial-home")) {
        const aura = document.createElement("div");
        aura.className = "cursor-aura";
        document.body.appendChild(aura);
        let frame = 0;
        let lastEvent;
        document.addEventListener("pointermove", event => {
            lastEvent = event;
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                const { clientX: x, clientY: y } = lastEvent;
                aura.style.left = `${x}px`; aura.style.top = `${y}px`;
                document.documentElement.style.setProperty("--cursor-x", `${x}px`);
                document.documentElement.style.setProperty("--cursor-y", `${y}px`);
            });
        }, { passive: true });
        document.addEventListener("pointerover", () => document.body.classList.add("has-cursor-aura"), { passive: true });
        document.addEventListener("pointerout", event => { if (!event.relatedTarget) document.body.classList.remove("has-cursor-aura"); }, { passive: true });

        document.querySelectorAll(tiltSelector).forEach(el => {
            el.addEventListener("pointermove", event => {
                const rect = el.getBoundingClientRect();
                const px = (event.clientX - rect.left) / rect.width;
                const py = (event.clientY - rect.top) / rect.height;
                el.style.setProperty("--pointer-x", `${px * 100}%`);
                el.style.setProperty("--pointer-y", `${py * 100}%`);
                el.style.setProperty("--tilt-x", `${(px - .5) * 3.5}deg`);
                el.style.setProperty("--tilt-y", `${(.5 - py) * 3.5}deg`);
                el.classList.add("is-pointed");
            }, { passive: true });
            el.addEventListener("pointerleave", () => {
                el.style.setProperty("--tilt-x", "0deg"); el.style.setProperty("--tilt-y", "0deg");
                el.classList.remove("is-pointed");
            }, { passive: true });
        });
    }

    document.querySelectorAll("button, .nav-links a, .login-links a, .nav-back, .nav-logout").forEach(el => {
        if (getComputedStyle(el).position === "static") el.style.position = "relative";
        el.style.overflow = "hidden";
        el.addEventListener("pointerdown", event => {
            if (reduceMotion) return;
            const rect = el.getBoundingClientRect();
            const ripple = document.createElement("i");
            ripple.className = "ui-ripple";
            ripple.style.left = `${event.clientX - rect.left}px`;
            ripple.style.top = `${event.clientY - rect.top}px`;
            el.appendChild(ripple);
            setTimeout(() => ripple.remove(), 650);
        }, { passive: true });
    });
})();

// Cards in users.html are streamed from Supabase after this module loads.
// Observe that stream so newly added cards receive the same tactile surface.
(function bindDynamicCardInteractions() {
    const list = document.getElementById("userList");
    if (!list) return;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bind = (card) => {
        if (card.dataset.interactionBound) return;
        card.dataset.interactionBound = "1";
        card.classList.add("interaction-spotlight", "tilt-item");
        if (!reduced) {
            requestAnimationFrame(() => card.classList.add("is-visible"));
            card.addEventListener("pointermove", event => {
                const rect = card.getBoundingClientRect();
                const px = (event.clientX - rect.left) / rect.width;
                const py = (event.clientY - rect.top) / rect.height;
                card.style.setProperty("--pointer-x", `${px * 100}%`);
                card.style.setProperty("--pointer-y", `${py * 100}%`);
                card.style.setProperty("--tilt-x", `${(px - .5) * 3.5}deg`);
                card.style.setProperty("--tilt-y", `${(.5 - py) * 3.5}deg`);
                card.classList.add("is-pointed");
            }, { passive: true });
            card.addEventListener("pointerleave", () => {
                card.style.setProperty("--tilt-x", "0deg");
                card.style.setProperty("--tilt-y", "0deg");
                card.classList.remove("is-pointed");
            }, { passive: true });
        } else card.classList.add("is-visible");
    };
    list.querySelectorAll(".user-card").forEach(bind);
    new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches(".user-card")) bind(node);
        node.querySelectorAll && node.querySelectorAll(".user-card").forEach(bind);
    }))).observe(list, { childList: true, subtree: true });
})();


