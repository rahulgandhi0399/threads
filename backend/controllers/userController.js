import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt, { hash } from "bcrypt";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js"
import {v2 as cloudinary} from "cloudinary";
import mongoose from "mongoose";
const signupUser = async (req,res) => {
    try{
        const {name,email,username,password} = req.body;
        const user = await User.findOne({$or:[{email},{username}]});

        if(user){
            return res.status(400).json({error:"User already exists"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedpassword = await bcrypt.hash(password,salt);
        
        const newUser = new User({
            name,
            email,
            username,
            password:hashedpassword
        })
        await newUser.save();

        if(newUser){
            generateTokenAndSetCookie(newUser._id,res);
            res.status(201).json({
                _id:newUser._id,
                name: newUser.name,
                email: newUser,email,
                username: newUser.username,
                bio:newUser.bio,
                profilePic:newUser.profilePic,
            })
        } else {
            res.status(400).json({error: "Invalid user data"})
        }
    }
    catch(err){
     res.status(500).json({error:err.message})
     console.log("Error in signupUser:",err.message)
    }
}

const getUserProfile = async (req,res) => {
   const {query } = req.params;
    try{
       let user ;
       if(mongoose.Types.ObjectId.isValid(query)){

        user = await User.findOne({_id:query}).select("-password").select("-updatedAt");
       }
       else{
        user = await await User.findOne({username:query}).select("-password").select("-updatedAt");
       }
       if(!user) return res.status(400).json({error:"User not found"});

       res.status(200).json(user);
    }
    catch(err){
     res.status(500).json({error:err.message})
     console.log("Error in signupUser:",err.message)
    }
}



const loginUser = async (req,res) => {
    try{
        const {username,password} = req.body;
        const user = await User.findOne({username});
        const isPasswordCorrect = await bcrypt.compare(password,user?.password || "");

        if(!user|| !isPasswordCorrect) return res.status(400).json({error:"Invalid username  or password"});

            generateTokenAndSetCookie(user._id,res);
            res.status(201).json({
                _id:user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                bio:user.bio,
                profilePic:user.profilePic,
            })
    }
    catch(err){
     res.status(500).json({error:err.message})
     console.log("Error in signupUser:",err.message)
    }
}

const logOut = async (req,res) => {
    try{
        res.cookie("jwt","",{maxAge:1});
        res.status(200).json({message:"User logged out successfully"});
    }
    catch(err){
     res.status(500).json({error:err.message})
     console.log("Error in signupUser:",err.message)
    }
}

const followUnFollowUser = async (req,res) => {
    try{
        
      const {id} = req.params;
      const userToModify = await User.findById(id);
      const currentUser = await User.findById(req.user._id);
      console.log(1);
      if(id === req.user._id.toString()) return res.status(400).json({error:"you cannot follow/unfollow yourself"});

     if(!userToModify || !currentUser) return res.status(400).json({error:"User not found"});

      const isFollowing = currentUser.following.includes(id);
      if (isFollowing){
        await User.findByIdAndUpdate(id,{$pull:{followers:req.user._id}});
        await User.findByIdAndUpdate(req.user._id,{$pull:{following: id}});
        res.status(200).json({message:"User unfollowed successfully"})
      } else {
        await User.findByIdAndUpdate(id,{$push:{followers:req.user._id}});
        await User.findByIdAndUpdate(req.user._id,{$push:{following: id}});
        res.status(200).json({message:"User followed successfully"})
      }
 
    }
    catch(err){
     res.status(500).json({error:err.message})
     console.log("Error in signupUser:",err.message)
    }
}

const updateUser = async (req,res) => {
    const {name, email,username,password,bio} = req.body;
    let {profilePic} = req.body
    const userId = req.user._id;
    try{
       let  user = await User.findById(userId);
       if(!user) return res.status(400).json({error:"User not found"});
       
       if(req.params.id !== userId.toString())
           return res.status(400).json({error:"you cannot update other users profile"});

       if(password){
        const salt = await bcrypt.genSalt(10);
        const hashedpassword = await bcrypt.hash(password,salt);
        user.password = hashedpassword;
       }

       if(profilePic){
        if(user.profilePic){
            await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0])
        }
        const uploadedResponse = await cloudinary.uploader.upload(profilePic);
        profilePic = uploadedResponse.secure_url;
       }

       user.name = name || user.name;
       user.email = email || user.email;
       user.username = username || user.username;
       user.profilePic = profilePic || user.profilePic;
       user.bio = bio || user.bio;
       
       user = await user.save();
     
       // Find all posts that this user replied and update username and userProfilePic fields
		await Post.updateMany(
			{ "replies.userId": userId },
			{
				$set: {
					"replies.$[reply].username": user.username,
					"replies.$[reply].userProfilePic": user.profilePic,
				},
			},
			{ arrayFilters: [{ "reply.userId": userId }] }
		);


       user.password = null;
       res.status(200).json({user});
     
 
    }
    catch(err){
     res.status(500).json({error:err.message})
     console.log("Error in signupUser:",err.message)
    }
}

export {signupUser,loginUser,logOut,followUnFollowUser,updateUser,getUserProfile};