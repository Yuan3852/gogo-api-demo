<template>
    <Chart v-if="showChart" :highcharts="Highcharts" :options="options"/>
</template>


<script>
import {Chart} from 'highcharts-vue'
import Highcharts from 'highcharts'
import Exporting from "highcharts/modules/exporting";
import exportdata from "highcharts/modules/export-data";
import stockInit from 'highcharts/modules/stock'
import Vue from 'vue'

Exporting(Highcharts)
exportdata(Highcharts)
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
                text: "Datalog",
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
                        text: "Sensor Value",
                    },
                },
                xAxis: {
                    type: "datetime",
                    tickInterval: 86400 * 10, // 1000 for 1 ms then 10 is 100ms
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
