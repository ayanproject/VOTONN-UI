const BACKEND_URL = "/api";

window.addEventListener("load", async () => {
  if (typeof checkAuth === "function") {
    await checkAuth();
  }
});

const PASSWORD_RULES = [
  {
    id: "rule-length",
    test: (p) => p.length >= 8,
  },
  {
    id: "rule-upper",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "rule-lower",
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: "rule-number",
    test: (p) => /[0-9]/.test(p),
  },
  {
    id: "rule-special",
    test: (p) => /[!@#$%^&*]/.test(p),
  },
];

const passwordInput = document.getElementById("password");

passwordInput.addEventListener("input", () => {

  const password = passwordInput.value;

  updateRules(password);
  updateStrength(password);

});

function updateRules(password){

  PASSWORD_RULES.forEach(rule => {

    const el = document.getElementById(rule.id);

    if(rule.test(password)){
      el.classList.add("passed");
    }else{
      el.classList.remove("passed");
    }

  });

}

function updateStrength(password){

  const fill = document.getElementById("signupStrengthFill");
  const label = document.getElementById("signupStrengthLabel");

  let passed = PASSWORD_RULES.filter(r => r.test(password)).length;

  const percent = (passed / PASSWORD_RULES.length) * 100;

  fill.style.width = percent + "%";

  if(percent < 40){
    fill.style.background = "#ff5d5d";
    label.textContent = "Weak";
  }
  else if(percent < 80){
    fill.style.background = "#f5a623";
    label.textContent = "Medium";
  }
  else{
    fill.style.background = "#2dd4a0";
    label.textContent = "Strong";
  }

}

document
  .getElementById("toggleSignupPassword")
  .addEventListener("click", () => {

    const input = document.getElementById("password");

    if(input.type === "password"){
      input.type = "text";
    }else{
      input.type = "password";
    }

  });

document
  .getElementById("signupForm")
  .addEventListener("submit", async (e) => {

    e.preventDefault();

    const user = {
      name: document.getElementById("name").value,
      age: document.getElementById("age").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      gender: document.getElementById("gender").value,
      password: document.getElementById("password").value,
    };

    try{

      const response = await fetch(`${BACKEND_URL}/register`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify(user)
      });

      if(response.ok){

        alert("Account Created Successfully");

        window.location.href = "index.html";

      }else{

        const error = await response.text();

        alert(error);

      }

    }catch(err){

      console.error(err);

      alert("Backend connection failed");

    }

  });