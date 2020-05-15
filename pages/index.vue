<template>
    <div class="bg-white text-center">
        <h1 class="text-xl my-4">
            Please enter your name to learn what your cow name would be:
        </h1>
        <div class="my-4">
            <input
                v-model="name"
                class="border border-black"
                placeholder="enter a name"
            />
            <button
                class="border border-black bg-gray-200"
                @click="getCowName()"
            >
                What is my cow name?
            </button>
        </div>
        <h1 class="text-4xl">{{ cowName }}</h1>
    </div>
</template>

<script>
const getRandomInt = (max) => {
    return Math.floor(Math.random() * Math.floor(max))
}

const getRandomItem = (array) => {
    return array[Math.floor(Math.random() * array.length)]
}

const getRandomName = (cowNameObject) => {
    const which = getRandomInt(3)
    const regularName = cowNameObject.RegName
    const sireName = cowNameObject.SireName
    const maternalGrandSireName = cowNameObject.MgsName

    if (which === 0) {
        return regularName
    }
    if (which === 1) {
        return sireName
    }
    if (which === 2) {
        return maternalGrandSireName
    }
}

const formatName = (name) => {
    name = name.trim()
    name = name.replace('-ET', '')
    name = name.replace(/[^a-zA-Z -]/g, '')
    name = name.replace(' ET', '')
    name = name.replace(' TM', '')
    return name
}

async function getRandomCowNameFormatted(name) {
    const result = await fetch(
        `/.netlify/functions/myFirstFunction?name=${name}`
    )
    const json = await result.json()

    const randomCowObject = getRandomItem(json.Item.cowNames)
    const cowName = getRandomName(randomCowObject)
    const nameFormatted = formatName(cowName)

    return nameFormatted
}

module.exports = {
    data() {
        return {
            cowName: '',
            name: ''
        }
    },
    methods: {
        async getCowName() {
            this.cowName = await getRandomCowNameFormatted(this.name)
        }
    }
}
</script>
