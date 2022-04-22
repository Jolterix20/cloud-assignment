const express = require('express')
const { Bigtable } = require('@google-cloud/bigtable')

const app = express()
app.use(express.json())

const PORT = process.env.POST || 8080

const bigTableClient = new Bigtable()
const instance = bigTableClient.instance('hello1234')
const table = instance.table('posts')

const getPost = (row) => {
	return row.data['post']
}

app.get('/', (req, res) => {
	res.send('Hello from App Engine!')
})

app.get('/posts', async (req, res) => {
	try {
		const [posts] = await table.getRows()

		const postsToSend = []
		for (const post of posts) {
			postsToSend.push(getPost(post))
		}

		res.status(200).send(postsToSend)
	} catch (error) {
		res.send(404).json({ message: error.message })
	}
})

app.post('/posts', async (req, res) => {
	try {
		const postToWrite = {
			key: req.body.key,
			data: {
				['post']: {
					timestamp: new Date(),
					title: req.body.title,
					description: req.body.description,
				},
			},
		}

		await table.insert(postToWrite)
		res.status(201).json({ message: `${postToWrite.key} is written` })
	} catch (error) {
		res.send(500).json({ message: error.message })
	}
})

app.delete('/posts/:id', async (req, res) => {
	try {
		const row = `post${req.params.id}`
		await table.row(row).delete()

		res.status(200).json({ message: 'Deleted' })
	} catch (error) {
		res.send(404).json({ message: error.message })
	}
})

app.get('/posts/:id', async (req, res) => {
	const row = `post${req.params.id}`
	try {
		const [post] = await table.row(row).get()

		const postToSend = post.data.post
		res.status(200).send(postToSend)
	} catch (error) {
		res.status(404).json({ message: error.message })
	}
})

app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`)
})
