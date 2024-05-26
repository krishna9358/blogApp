import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";
import { Hono } from "hono";

export const blogRouter = new Hono<
{
    Bindings :{
DATABASE_URL: string;
JWT_SECRET: string;
    }
    Variables : {
        userId: string;
    }
}
>();

blogRouter.use("/*", async (c, next) => {
  const authHeader = c.req.header('Authorization') || "";
  const user = await verify(authHeader, c.env.JWT_SECRET);
  if(user){
    c.set("userId", user.id as string);  
   await next();
  }else{
    c.status(401);
    return c.json({message: "Unauthorized"});
  }  

})

blogRouter.post('/', async (c) => {

    const body = await c.req.json();
    const userId = c.get("userId");
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await prisma.blog.create({
      data: {
        title: body.title,
        content: body.content,
        authorId : Number(userId),
      }
    })
    return c.json({id: blog.id}) 
  })
  
  blogRouter.put('/', async (c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await prisma.blog.update({
      where: {
        id: body.id
      },
      data: {
        title: body.title,
        content: body.content,
      }
    })
    return c.json({id: blog.id})
  })
  
  blogRouter.get('/:id', async (c) => {
    const id  =  c.req.param("id");
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try{
      const blog = await prisma.blog.findFirst({
        where: {
          id: Number(id)
        }
      })
      return c.json({blog})
    }catch(e){
      c.status(411);
      return c.json({error: e , message: "Blog not found"});
    }
  })
  //pagination add 
  blogRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blogs = prisma.blog.findMany();

    return c.json({blogs})
  })

  
export default blogRouter;
