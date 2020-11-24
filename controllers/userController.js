exports.getAllUsers = ((req,res)=>{
    console.log(req.body);
    res.status(200).send({
        'status': 'success',
        'message': 'users successfully retrieved'
    })
})