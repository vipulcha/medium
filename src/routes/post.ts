import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'

export const blogRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string,
		JWT_SECRET: string,
	},
	Variables : {
		userId: string
	}
}>();

blogRouter.use('/*', async (c, next) => {
	
	const jwt = c.req.header('Authorization')||"";
	if (!jwt) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
	// const token = jwt.split(' ')[1];

	const payload = await verify(jwt, c.env.JWT_SECRET);
	if (!payload) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
	
	c.set('userId', payload.id);
	
	await next()
	
})





blogRouter.get('/:id', async (c) => {
	
	const prisma = new PrismaClient({
        datasourceUrl:c.env?.DATABASE_URL,
    }).$extends(withAccelerate())
	
    const id = await c.req.param("id");
	try{
	const authorId = c.get('userId');
     const post= await prisma.post.findFirst({
		where: {
			id: id,
		},
        })

	return c.json({
		post,
	});
	} catch(e) {
		c.status(411);
		return c.json({
			message: "mamla pil gaya",
		})
	}
})

blogRouter.post('/i', async (c) => {
	
    const prisma = new PrismaClient({
        datasourceUrl:c.env?.DATABASE_URL,
    }).$extends(withAccelerate())
  
    const body = await c.req.json();
		const authorId = c.get('userId');
     const post= await prisma.post.create({
            data:{
                title:body.title,
                content: body.content,
				author: { connect : { id: authorId }},
            }
        })

	return c.json({
		id: post.id,
	});
})

blogRouter.put('/i', async (c) => {
	const prisma = new PrismaClient({
        datasourceUrl:c.env?.DATABASE_URL,
    }).$extends(withAccelerate())
  
    const body = await c.req.json();
	const authorId = c.get('userId');
     const post= await prisma.post.update({
	where: {
			id: body.id,
		},
        data:{
            title:body.title,
            content: body.content,
			author: { connect : { id: authorId }},
        }
        })

	return c.json({
		id: post.id,
	});
})

blogRouter.get('/i/bulk',async  (c) => {
	const prisma = new PrismaClient({
        datasourceUrl:c.env?.DATABASE_URL,
    }).$extends(withAccelerate())

	const blogs = await prisma.post.findMany();

	return c.json({
		blogs,
	})
})

