<template>
    <Chart v-if="showChart" :options="options"/>
</template>


<script>
import {Chart} from 'highcharts-vue'
import Highcharts from 'highcharts'
import stockInit from 'highcharts/modules/stock'
import Vue from 'vue'

stockInit(Highcharts)

export default{
    name:"ChartVue",
    components: {
        Chart,
    },
    props: {
        series:{
            type: Array,
            default: () => [],
        }
    },
    data: () => ({
        showChart: true
    }),
    computed: {
        options() {
            return {
                colors: ["#77a1e5", "#2c3e50"],
                title: {
                text: "Coins",
                style: {
                    "font-family": "Avenir, Helvetica, Arial, sans-serif",
                    "-webkit-font-smoothing": "antialiased",
                    "-moz-osx-font-smoothing": "grayscale",
                    color: "#2c3e50",
                    "font-weight": "bold",
                    "font-size": "100%",
                },
                },
                yAxis: {
                title: {
                    text: "Coin/h",
                },
                },
                xAxis: {
                type: "datetime",
                tickInterval: 86400 * 1000, // 1 day in ms
                labels: {
                    rotation: 60,
                },
                },
                series: this.series,
        };
        },
    },
    watch: {
        series: {
        handler() {
            // this destroys the chart
            this.showChart = false;
            this.$nextTick(() => {
            // this renders a new one, with the new set of data
            this.showChart = true;
            });
        },
        },
    },
}
</script>
