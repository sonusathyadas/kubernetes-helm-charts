const router = require("express").Router();

router.get("", (req,resp)=>{
    resp.json({ name:"Sonu", age:20})
})

module.exports = router;